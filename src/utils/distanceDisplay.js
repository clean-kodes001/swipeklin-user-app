// Display + freshness rules for the en-route distance row, shared verbatim by both apps
// (same duplication convention as utils/locationFilter.js — there is no shared package).
//
// THE INVARIANT: the kilometres rendered to a user are ALWAYS a Google Directions road
// distance. BUG-1001 happened because a great-circle value and a road value both wrote the
// same state, and the two apps ended up showing different ones under the same "km" label.
// metersBetween() below exists ONLY to decide when to re-request a route; its output must
// never reach the screen.

// A cleaner en route pushes every 10s (ENROUTE_UPDATE_STATUS_THROTTLE_MS) and every 30s
// when idle. 90s tolerates ~9 missed en-route pushes — long enough that ordinary mobile
// network hiccups don't flag a healthy cleaner, short enough that a dead app is caught.
export const POSITION_TTL_MS = 90000;

// How far the cleaner must move before the route/ETA is re-requested. Both apps use the
// same value so they re-request on the same cadence.
export const ORIGIN_DRIFT_M = 75;

// On final approach a 75m threshold is larger than the distance left to travel, so the
// number freezes at the last committed origin while the cleaner walks the last stretch.
// Inside APPROACH_RANGE_M the threshold tightens so it keeps ticking down. 20m is the
// floor worth using — below that GPS noise, not movement, drives the updates.
export const APPROACH_RANGE_M = 1000;
export const APPROACH_DRIFT_M = 20;

// Final stretch: inside this range the two apps are side by side on someone's screen and a
// 20m dead zone is visible as one reading 10m while the other reads 0m. Tightening to 10m
// costs ~10 extra requests over the last 100m, and a parked cleaner triggers none — the
// Kalman-smoothed estimate doesn't wander 10m while stationary.
export const FINAL_RANGE_M = 100;
export const FINAL_DRIFT_M = 10;

/**
 * Drift threshold to apply given how far the cleaner still has to go.
 *
 * @param {?number} remainingKm - last known road distance, or null before the first route
 */
export const originDriftThresholdM = remainingKm => {
  if (!Number.isFinite(remainingKm)) return ORIGIN_DRIFT_M;
  const remainingM = remainingKm * 1000;
  if (remainingM <= FINAL_RANGE_M) return FINAL_DRIFT_M;
  if (remainingM <= APPROACH_RANGE_M) return APPROACH_DRIFT_M;
  return ORIGIN_DRIFT_M;
};

const EARTH_RADIUS_M = 6371000;

// Great-circle metres. THROTTLING ONLY — never format this for display.
export const metersBetween = (aLat, aLng, bLat, bLng) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/**
 * Render a Directions road distance at a precision the data actually supports.
 *
 * Two decimals (the old behaviour) claimed 10m precision on a number whose origin
 * legitimately moves up to ~250m between heartbeats — so normal, correct drift looked like
 * a defect. That is what made BUG-1001 reportable in the first place.
 *
 * @param {number} km - result.distance from react-native-maps-directions (already km)
 * @returns {?string} display string, or null when there is nothing to show yet
 */
export const formatDistance = km => {
  if (!Number.isFinite(km) || km < 0) return null;
  const metres = Math.round((km * 1000) / 10) * 10;
  if (metres < 1000) return `${metres} m`;
  if (km < 9.95) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

/**
 * Pick the coordinate the CUSTOMER app should route from, and say how much to trust it.
 *
 * Three defects this closes:
 *  - the live broadcast was used without checking it belongs to THIS clean's cleaner,
 *    while the map marker beside it did check
 *  - cleanersLocation is persisted to AsyncStorage and was never cleared, so a previous
 *    cleaner's position could seed a new job
 *  - nothing distinguished "cleaner is parked" from "cleaner's app is dead"
 *
 * @returns {?{lat:number, lng:number, source:'live'|'match', isStale:boolean}}
 */
export const selectCleanerOrigin = ({
  cleanersLocation,
  activeCleaner,
  nowMs,
  serverOffsetMs = 0,
  ttlMs = POSITION_TTL_MS,
}) => {
  const liveLat = cleanersLocation?.current_position?.lat;
  const liveLng = cleanersLocation?.current_position?.lng;

  // The broadcast carries the cleaner's USER id; activeCleaner is the Cleaner row.
  const belongsToThisCleaner =
    activeCleaner?.user_id != null && cleanersLocation?.id === activeCleaner.user_id;

  if (belongsToThisCleaner && Number.isFinite(liveLat) && Number.isFinite(liveLng)) {
    // `at` is stamped with the receiving device's own clock, so this comparison is
    // device-to-device: applying serverOffsetMs here would fold the device-vs-server clock
    // skew into the age and mark a perfectly live feed stale. Only the match branch below,
    // which reads a server-issued timestamp, needs the offset.
    const age =
      typeof cleanersLocation?.at === 'number' ? nowMs - cleanersLocation.at : Infinity;
    return {lat: liveLat, lng: liveLng, source: 'live', isStale: age > ttlMs};
  }

  // No usable broadcast: fall back to where the cleaner was when they accepted. That is
  // accurate for the first few seconds and decays from there, so age it off the accept
  // time rather than trusting it forever.
  const matchLat = activeCleaner?.position?.lat;
  const matchLng = activeCleaner?.position?.lng;
  if (Number.isFinite(matchLat) && Number.isFinite(matchLng)) {
    // created_at comes from the server, so shift the device clock into server time first.
    const acceptedAt = Date.parse(activeCleaner?.created_at ?? '');
    const age = Number.isFinite(acceptedAt)
      ? nowMs + serverOffsetMs - acceptedAt
      : Infinity;
    return {lat: matchLat, lng: matchLng, source: 'match', isStale: age > ttlMs};
  }

  return null;
};
