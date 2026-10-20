// Location smoothing — a lightweight GPS Kalman filter.
//
// Android's "Fused" provider (playServices) blends GPS / Wi-Fi / cell / last-known
// and emits a jittery stream: the position oscillates and occasionally jumps hundreds
// of km, which makes the map pin and reverse-geocoded address fluctuate. iOS doesn't
// have this because CoreLocation smooths the stream inside the OS.
//
// evaluateFix() does the same thing in JS: instead of a brittle accept/reject on every
// fix, it keeps a running ESTIMATE plus an UNCERTAINTY (variance) and blends each new
// reading in, weighted by its reported accuracy. A precise fix nudges the estimate; a
// coarse/jittery one barely moves it. A truly implausible teleport is held off until a
// few consecutive fixes confirm it's real. The estimate is what the watcher should use.
//
// Bonus: a bad first fix self-corrects — it starts with a large variance, so the next
// good fix has a high Kalman gain and pulls the estimate to the right place.

// Tunables (centralized for easy field adjustment).
export const MAX_ACCURACY_M = 100; // also used by the user app's one-shot accuracy gate
export const MAX_SPEED_MPS = 55; // ~200 km/h — faster than any car; a jump beyond this is a glitch
export const MAX_GAP_S = 60; // cap the elapsed time used for the teleport check, so a long
// gap between fixes can't "justify" a teleport (a stationary device gets sparse fixes)
export const PROCESS_NOISE_MPS = 3; // expected real movement speed (m/s) — how fast the estimate
// is allowed to drift toward new readings; higher = follows movement faster, smooths less
export const CONFIRMATIONS = 3; // accept an implausible jump only after N consecutive agreeing fixes

const EARTH_RADIUS_M = 6371000;

// Great-circle distance in metres (haversine). Dependency-free so this module can be
// shared by apps that don't have `geolib` installed.
function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Smooth a freshly received GPS fix.
 *
 * @param {{latitude:number, longitude:number, accuracy?:number}} coords - pos.coords from Geolocation
 * @param {{lat:?number, lng:?number, accuracy:?number, variance:number, time:number, rejects:number}} state - caller-held ref value
 * @param {number} [nowMs] - current time (injectable for tests)
 * @returns {{accept:boolean, reason:string, position:?{lat:number,lng:number,accuracy:number}, nextState:object}}
 *   On accept, `position` is the SMOOTHED estimate the caller should use (map pin, geocode,
 *   current_position). On reject, accept is false and the caller should keep its last position.
 */
export function evaluateFix(coords, state, nowMs = Date.now()) {
  const prev = state || {
    lat: null,
    lng: null,
    accuracy: null,
    variance: 0,
    time: 0,
    rejects: 0,
  };

  if (
    !coords ||
    typeof coords.latitude !== 'number' ||
    typeof coords.longitude !== 'number'
  ) {
    return {accept: false, reason: 'invalid', position: null, nextState: prev};
  }

  const lat = coords.latitude;
  const lng = coords.longitude;
  // Reported accuracy is the measurement's standard deviation in metres. Floor at 1m,
  // and fall back to a coarse value when the platform doesn't report it.
  const acc =
    typeof coords.accuracy === 'number' && coords.accuracy > 0
      ? Math.max(coords.accuracy, 1)
      : MAX_ACCURACY_M;

  // 1. Bootstrap: first fix seeds the estimate. variance = accuracy^2 so a weak first
  //    fix is "loosely held" and the next good fix can correct it (Kalman gain).
  if (prev.lat == null || prev.lng == null) {
    return {
      accept: true,
      reason: 'bootstrap',
      position: {lat, lng, accuracy: acc},
      nextState: {lat, lng, accuracy: acc, variance: acc * acc, time: nowMs, rejects: 0},
    };
  }

  const dist = distanceMeters(prev.lat, prev.lng, lat, lng);
  const dtSec = Math.max(nowMs - prev.time, 1) / 1000;

  // 2. Teleport guard: a jump farther than is reachable at MAX_SPEED (with the elapsed
  //    time capped, so a long gap can't excuse a teleport) is almost certainly a Fused
  //    glitch. Hold the current estimate; only believe it after several consecutive fixes
  //    agree (a genuine relocation / GPS re-acquire), then hard-reset to it.
  const maxPlausible = MAX_SPEED_MPS * Math.min(dtSec, MAX_GAP_S);
  if (dist > maxPlausible) {
    const rejects = prev.rejects + 1;
    if (rejects < CONFIRMATIONS) {
      return {
        accept: false,
        reason: 'teleport',
        position: {lat: prev.lat, lng: prev.lng, accuracy: Math.sqrt(prev.variance)},
        nextState: {...prev, rejects},
      };
    }
    return {
      accept: true,
      reason: 'confirmed_jump',
      position: {lat, lng, accuracy: acc},
      nextState: {lat, lng, accuracy: acc, variance: acc * acc, time: nowMs, rejects: 0},
    };
  }

  // 3. Kalman update. Predict: grow the uncertainty by the process noise over the elapsed
  //    time. Correct: blend the reading in with gain K (estimate variance vs measurement
  //    variance). Coarse readings -> small K -> estimate barely moves -> jitter is damped.
  const predictedVariance =
    prev.variance + dtSec * PROCESS_NOISE_MPS * PROCESS_NOISE_MPS;
  const K = predictedVariance / (predictedVariance + acc * acc);
  const sLat = prev.lat + K * (lat - prev.lat);
  const sLng = prev.lng + K * (lng - prev.lng);
  const variance = (1 - K) * predictedVariance;

  // Report the DEVICE's accuracy, not sqrt(variance). The Kalman posterior is the filter's
  // confidence in its own estimate and collapses toward zero as fixes accumulate — but the
  // dominant real-world error downtown is systematic (multipath), which averaging does not
  // remove. Publishing the posterior made every consumer of `accuracy` believe a stationary
  // phone was accurate to centimetres: the Arrive gate's tolerance vanished (the button
  // flickered on, then locked out), and the server received an over-confident accuracy_m,
  // making JobSiteMonitor's off-site rule far stricter than intended. bootstrap and
  // confirmed_jump already report `acc`; this keeps all branches consistent.
  return {
    accept: true,
    reason: 'smoothed',
    position: {lat: sLat, lng: sLng, accuracy: acc},
    nextState: {lat: sLat, lng: sLng, accuracy: acc, variance, time: nowMs, rejects: 0},
  };
}
