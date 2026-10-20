import React, {useEffect, useState, useRef} from 'react';
import Text from '../Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import {acceptAmend} from '../../store/actions/dashboard/acceptAmend';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';

const AmendCountDown = () => {
  const {t} = useTranslation();
  const data = useSelector(state => state.user?.clean?.clean_amend);
  const {amendRequestTime, serverTimeOffset} = useSelector(state => state.user);
  const dispatch = useDispatch();
  const hasAcceptedRef = useRef(false);

  const [time, setTime] = useState({min: '01', sec: '00'});

  const handleAccept = () => {
    const payload = {
      status: 1,
      notes: '',
    };
    dispatch(
      acceptAmend({
        payload,
        callBack: () => {},
      }),
    );
  };

  useEffect(() => {
    if (!amendRequestTime || hasAcceptedRef.current) return;

    const ONE_MINUTE_MS = 60 * 1000;

    const updateTimer = () => {
      const now = new Date(Date.now() + (serverTimeOffset || 0));
      const serverStart = new Date(amendRequestTime);
      // Handle clock skew: if server time is in future, use device time
      const start = serverStart > now ? now : serverStart;
      const elapsed = Math.max(0, now - start);
      const remaining = ONE_MINUTE_MS - elapsed;

      if (remaining <= 0) {
        setTime({min: '00', sec: '00'});
        if (!hasAcceptedRef.current) {
          hasAcceptedRef.current = true;
          handleAccept();
        }
        return false;
      }

      const totalSec = Math.ceil(remaining / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setTime({
        min: min < 10 ? `0${min}` : `${min}`,
        sec: sec < 10 ? `0${sec}` : `${sec}`,
      });
      return true;
    };

    updateTimer();
    const interval = setInterval(() => {
      if (!updateTimer()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [amendRequestTime]);

  return (
    <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16}}>{t('cleanDetails.count_down')}{' '}
      <Text
        color={colors.brandPurple}
        fontType={'roboto'}
        bold
        style={{fontSize: 16}}>{`${time.min}:${time.sec}`}</Text>
    </Text>
  );
};

export default AmendCountDown;
