import React from 'react';
import {View} from 'react-native';

const Details = ({children, style}) => {
  return (
    <View
      style={{
        backgroundColor: '#F5F5F6',
        width: '100%',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        ...style,
      }}>
      {children}
    </View>
  );
};

export default Details;
