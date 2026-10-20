import React from 'react';
import {View, Image} from 'react-native';
import LottieView from 'lottie-react-native';
import Text from './Text';

const EmptyState = ({text, image, lottie}) => {
  const hasMedia = image || lottie;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {lottie && (
        <LottieView
          source={lottie}
          autoPlay
          loop
          style={{height: 300, width: 300, alignSelf: 'center'}}
        />
      )}
      {!lottie && image && (
        <Image
          style={{height: 250, width: 250, alignSelf: 'center'}}
          resizeMode="contain"
          source={image}
        />
      )}
      <Text
        fontType={'roboto'}
        center
        medium
        color={'#000'}
        style={{
          fontWeight: '500',
          fontSize: 14,
          marginBottom: 200,
          paddingHorizontal: 20,
          marginTop: hasMedia ? 16 : 0,
        }}>
        {text}
      </Text>
    </View>
  );
};

export default EmptyState;
