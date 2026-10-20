import React from 'react';
import {StyleSheet, View} from 'react-native';
import Text from '../components/Shared/Text';
import {colors} from '../config/colors';
import {useTranslation} from 'react-i18next';

const OTPTimer = ({minutes, seconds}) => {
  const {t} = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text medium style={styles.text}>{t('otp.expires_in')}</Text>
      {minutes === 0 || seconds === 0 || minutes || seconds ? (
        <Text bold style={[styles.text, {color: '#000'}]}>
          {minutes < 10 ? `0${minutes}` : minutes}:
          {seconds < 10 ? `0${seconds}` : seconds}
        </Text>
      ) : (
        <></>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.003,
    margin: 4,
    color: colors.grayText,
  },
});

export default OTPTimer;
