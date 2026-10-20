// The customer's "real" cleaner is the one actively working the clean — mirrors the
// backend Cleaner::WORKER_STATUSES (accepted → arrived → started → completed/…). A cleaner
// who accepted then cancelled has status 5 (or another non-worker status) and must be
// ignored, so the map/bottom-sheet revert to "searching" instead of showing a stale cleaner.
export const WORKER_STATUSES = [1, 3, 4, 7, 10, 11];

// The single active worker for a clean, or null. Filters out a cancelled/declined straggler.
export const getActiveCleaner = clean =>
  clean?.clean_cleaners?.find(c => WORKER_STATUSES.includes(c?.status)) ?? null;

export const hasActiveCleaner = clean => getActiveCleaner(clean) != null;
