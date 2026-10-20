import React from 'react';
import Text from '../Shared/Text';

const DetailsText2 = ({children}) => {
  return (
    <Text color={'#525354'} fontType={'roboto'} bold style={{fontSize: 12}}>
      {children}
    </Text>
  );
};

export default DetailsText2;
