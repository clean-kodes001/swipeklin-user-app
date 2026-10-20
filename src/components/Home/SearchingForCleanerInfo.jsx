import React, {useEffect, useState, useRef} from 'react';
import {ActivityIndicator, View} from 'react-native';
import Text from '../Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import {colors} from '../../config/colors';
import {
  showContactMeModalAction,
  hideContactMeModalAction,
} from '../../store/reducer/userSlice';
import {WORKER_STATUSES} from '../../utils/activeCleaner';
import {useTranslation} from 'react-i18next';

const SearchingForCleanerInfo = () => {
  const {t} = useTranslation();
  const {clean, arrivedState, serverTimeOffset} = useSelector(state => state.user);
  const dispatch = useDispatch();

  // Use refs for interval IDs to avoid stale closure issues and ensure proper cleanup
  const searchIntervalRef = useRef(null);
  const arrivedIntervalRef = useRef(null);
  const walkThroughIntervalRef = useRef(null);
  const workIntervalRef = useRef(null);
  // Remember the previous reactivated_at so we can clear a stale "no cleaner found" dialog
  // when a NEW re-search window begins (Fix B, below).
  const prevReactivatedAtRef = useRef(clean?.reactivated_at ?? null);

  const [time, setTime] = useState({min: '05', sec: '00'});
  const [arriveTimer, setArriveTimer] = useState({min: '05', sec: '00'});
  const [walkThroughTimer, setWalkThroughTimer] = useState({hr: '00', min: '00', sec: '00'});
  const [workTimer, setWorkTimer] = useState({hr: '00', min: '00', sec: '00'});

  // Derived values (safe to compute after hooks)
  const numCleanersNeeded = clean?.cleaners ?? 0;
  // Count only ACTIVE workers — a cancelled straggler (status 5) must not count, or the
  // timeout guard `numCleanersFound < numCleanersNeeded` stays false and the "no cleaner
  // found" dialog never fires after an accept→cancel→re-search.
  const numCleanersFound =
    clean?.clean_cleaners?.filter(c => WORKER_STATUSES.includes(c?.status)).length ?? 0;

  // Helper: format countdown (remaining time)
  const formatCountdown = (remainingMs) => {
    if (remainingMs <= 0) return {min: '00', sec: '00'};
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return {
      min: min < 10 ? `0${min}` : `${min}`,
      sec: sec < 10 ? `0${sec}` : `${sec}`,
    };
  };

  // Helper: format count-up (elapsed time)
  const formatCountUp = (elapsedMs) => {
    if (elapsedMs < 0) return {hr: '00', min: '00', sec: '00'};
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hr = Math.floor(totalSeconds / 3600);
    const min = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    return {
      hr: hr < 10 ? `0${hr}` : `${hr}`,
      min: min < 10 ? `0${min}` : `${min}`,
      sec: sec < 10 ? `0${sec}` : `${sec}`,
    };
  };

  // Main Search Timer (5 min countdown)
  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    // Clear any existing interval first
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    // Derive the window start locally so it is ALWAYS the current window (reactivated_at on a
    // re-search, else created_at). Computing it here — instead of from a lagging state var — is
    // what stops the dialog firing off a stale created_at the instant a re-search begins.
    const serverStart = clean?.reactivated_at || clean?.created_at;
    if (!serverStart) return;
    const timerStart = new Date(serverStart);

    const updateTimer = () => {
      const now = new Date(Date.now() + (serverTimeOffset || 0));
      const start = new Date(timerStart);
      const elapsed = Math.max(0, now - start);
      const remaining = FIVE_MINUTES_MS - elapsed;
      
      if (remaining <= 0) {
        setTime({min: '00', sec: '00'});
        // Only show modal if we are strictly in the "Searching" phase (status < 1)
        // AND we haven't found enough cleaners.
        const isSearching = clean?.clean_cleaners_status == null || clean?.clean_cleaners_status < 1;
        if (isSearching && numCleanersFound < numCleanersNeeded) {
          dispatch(showContactMeModalAction());
        }
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
        return;
      }
      setTime(formatCountdown(remaining));
    };

    // Run timer if:
    // 1. We have a timer start time
    // 2. No cleaner has been assigned yet (clean_cleaners_status < 1) OR still searching (found < needed)
    const shouldRunTimer = timerStart && (
      (clean?.clean_cleaners_status == null || clean?.clean_cleaners_status < 1) ||
      (numCleanersNeeded > 0 && numCleanersFound < numCleanersNeeded)
    );
    
    if (shouldRunTimer) {
      // Update immediately - no delay
      updateTimer();
      // Then update every second
      searchIntervalRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    };
  }, [
    clean?.reactivated_at,
    clean?.created_at,
    numCleanersFound,
    numCleanersNeeded,
    clean?.clean_cleaners_status,
    dispatch,
  ]);

  // Fix B — when a NEW re-search window begins (reactivated_at changes to a new value), clear any
  // stale "no cleaner found" dialog. Guarded by a ref so it only fires on an actual change (not on
  // mount). A real timeout terminates the clean (GET returns null, reactivated_at unchanged), so
  // this never dismisses a legitimate timeout dialog.
  useEffect(() => {
    const current = clean?.reactivated_at ?? null;
    if (current && current !== prevReactivatedAtRef.current) {
      prevReactivatedAtRef.current = current;
      dispatch(hideContactMeModalAction());
    } else {
      prevReactivatedAtRef.current = current;
    }
  }, [clean?.reactivated_at, dispatch]);

  // Arrived Timer (5 min countdown from arrival)
  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    // Clear any existing interval first
    if (arrivedIntervalRef.current) {
      clearInterval(arrivedIntervalRef.current);
      arrivedIntervalRef.current = null;
    }

    if (!arrivedState) {
      setArriveTimer({min: '00', sec: '00'});
      return;
    }

    const updateTimer = () => {
      const now = new Date(Date.now() + (serverTimeOffset || 0));
      const start = new Date(arrivedState);
      const elapsed = Math.max(0, now - start);
      const remaining = FIVE_MINUTES_MS - elapsed;

      if (remaining <= 0) {
        setArriveTimer({min: '00', sec: '00'});
        if (arrivedIntervalRef.current) {
          clearInterval(arrivedIntervalRef.current);
          arrivedIntervalRef.current = null;
        }
        return;
      }
      setArriveTimer(formatCountdown(remaining));
    };

    // Update immediately - no delay
    updateTimer();
    // Then update every second
    arrivedIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (arrivedIntervalRef.current) {
        clearInterval(arrivedIntervalRef.current);
        arrivedIntervalRef.current = null;
      }
    };
  }, [arrivedState]);

  // Walk-Through Timer (count up)
  useEffect(() => {
    const startTime = clean?.images_time?.start;

    // Clear any existing interval first
    if (walkThroughIntervalRef.current) {
      clearInterval(walkThroughIntervalRef.current);
      walkThroughIntervalRef.current = null;
    }

    if (!startTime) {
      setWalkThroughTimer({hr: '00', min: '00', sec: '00'});
      return;
    }

    const updateTimer = () => {
      const now = new Date(Date.now() + (serverTimeOffset || 0));
      const start = new Date(startTime);
      const elapsed = Math.max(0, now - start);
      setWalkThroughTimer(formatCountUp(elapsed));
    };

    // Update immediately - no delay
    updateTimer();
    // Then update every second
    walkThroughIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (walkThroughIntervalRef.current) {
        clearInterval(walkThroughIntervalRef.current);
        walkThroughIntervalRef.current = null;
      }
    };
  }, [clean?.images_time?.start]);

  // Work Timer (count up from status 4)
  useEffect(() => {
    const startTime = clean?.clean_cleaners_status_time?.t4;

    // Clear any existing interval first
    if (workIntervalRef.current) {
      clearInterval(workIntervalRef.current);
      workIntervalRef.current = null;
    }

    if (!startTime || clean?.clean_cleaners_status !== 4) {
      setWorkTimer({hr: '00', min: '00', sec: '00'});
      return;
    }

    const updateTimer = () => {
      const now = new Date(Date.now() + (serverTimeOffset || 0));
      const start = new Date(startTime);
      const elapsed = Math.max(0, now - start);
      // console.log('Work Timer Update:', {elapsed, startTime, now: now.toISOString()});
      setWorkTimer(formatCountUp(elapsed));
    };

    // Update immediately - no delay
    updateTimer();
    // Then update every second
    workIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (workIntervalRef.current) {
        clearInterval(workIntervalRef.current);
        workIntervalRef.current = null;
      }
    };
  }, [clean?.clean_cleaners_status_time?.t4, clean?.clean_cleaners_status]);

  // Early return AFTER all hooks - prevents rendering with null data
  if (!clean) {
    return null;
  }
  return (
    <View
      style={{
        backgroundColor: '#F5F5F6',
        width: '100%',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
      }}>
      <View style={{width: '75%', justifyContent: 'center', gap: 4}}>
        {/* Status Display - show cleaner status if status exists (1=accepted, 2=enroute, 3=arrived, 4=cleaning) */}
          {clean?.clean_cleaners_status != null && clean?.clean_cleaners_status >= 1 ? (
          <Text color={'#000'} fontType={'roboto'} bold style={{fontSize: 12}}>{t('cleanDetails.searching_status')}{' '}
            {clean?.clean_cleaners_status === 4 ? (
              <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.cleaning_in_progress')}</Text>
            ) : clean?.clean_cleaners_status === 3 ? (
              <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
                {clean?.images_time?.start
                  ? 'Walk-through in progress'
                  : `${clean?.clean_cleaners?.[clean?.clean_cleaners?.length - 1]?.user?.first_name ?? 'Cleaner'} has arrived.`}
              </Text>
            ) : (
              <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.request_accepted_by')}{' '}
                <Text color={'#525354'} fontType={'roboto'} capitalized style={{fontSize: 12}}>
                  {clean?.clean_cleaners?.[clean?.clean_cleaners?.length - 1]?.user?.first_name ?? 'a cleaner'}
                </Text>
              </Text>
            )}
          </Text>
        ) : (
          <>
            <Text color={'#000'} fontType={'roboto'} bold style={{fontSize: 12}}>{t('cleanDetails.searching_status')}{' '}
              <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
                {t('cleanDetails.looking_for_cleaners_full', {count: numCleanersFound > 0 ? numCleanersNeeded - numCleanersFound : numCleanersNeeded})}
              </Text>
            </Text>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.searching_for_cleaners')}</Text>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.time_remaining_search')}{' '}
              <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16}}>
                {`${time.min}:${time.sec}`}
              </Text>
            </Text>
          </>
        )}

        {/* Arrived Timer (only show when status 3 and no walkthrough started) */}
        {clean?.clean_cleaners_status === 3 && !clean?.images_time?.start && arrivedState && (
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.arrived_timer_label')}{' '}
            <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16}}>
              {`${arriveTimer.min}:${arriveTimer.sec}`}
            </Text>
          </Text>
        )}

        {/* Walk-through Timer */}
        {clean?.clean_cleaners_status === 3 && clean?.images_time?.start && (
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.walk_through_timer')}{' '}
            <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16}}>
              {`${walkThroughTimer.hr}:${walkThroughTimer.min}:${walkThroughTimer.sec}`}
            </Text>
          </Text>
        )}

        {/* Work Timer */}
        {clean?.clean_cleaners_status === 4 && clean?.clean_cleaners_status_time?.t4 && (
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.work_timer')}{' '}
            <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16}}>
              {`${workTimer.hr}:${workTimer.min}:${workTimer.sec}`}
            </Text>
          </Text>
        )}
      </View>

      {/* Loading Indicator - only during search phase */}
      <View style={{width: '15%', justifyContent: 'center', alignItems: 'center'}}>
        {clean?.clean_cleaners_status == null || clean?.clean_cleaners_status < 1 ? (
          numCleanersFound < numCleanersNeeded &&
          time.sec !== '00' &&
          time.sec !== '--' && (
            <ActivityIndicator size={'large'} color={colors.primary} />
          )
        ) : null}
      </View>
    </View>
  );
};

export default SearchingForCleanerInfo;
