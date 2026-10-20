import React from 'react';
import Text from '../Shared/Text';

const DetailsText1 = ({children}) => {
  return (
    <Text color={'#525354'} bold fontType={'roboto'} style={{fontSize: 14}}>
      {children}
    </Text>
  );
};

export default DetailsText1;
