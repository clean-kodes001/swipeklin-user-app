import {Platform, Share} from 'react-native';
import {captureRef} from 'react-native-view-shot';

export const generateReceipt = async (ref, t) => {
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  if (Platform.OS === 'ios') {
    await Share.share({url: uri});
  } else {
    const RNShare = require('react-native-share').default;
    await RNShare.open({
      url: uri,
      type: 'image/png',
      title: `SwipeKlin ${t('history.receipt_title')}`,
      failOnCancel: false,
    });
  }
};
