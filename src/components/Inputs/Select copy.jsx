import React, {useEffect, useRef, useState} from 'react';
import {Platform, Pressable, StyleSheet, Touchable, View} from 'react-native';
import Text from '../Shared/Text';
import {Picker, PickerProps, PickerIOS} from '@react-native-picker/picker';

const Select = ({
  label,
  style,
  mt,
  error,
  hideError,
  onChangeValue,
  value,
  borderError,
  list,
  fullWidth,
  placeholder,
  disabled,
  width,
  multiple,
  max,
  onBlur,
  pickerRef,
}) => {
  const [showIOSSelect, setShowIOSSelect] = useState(false);

  // const pickerRef = useRef();

  // function open() {
  //   pickerRef.current.focus();
  // }

  // function close() {
  //   pickerRef.current.blur();
  // }

  const renderItems = item => {
    const {name, id} = item;

    return (
      <Picker.Item
        key={id}
        label={name}
        value={id}

        // style={{backgroundColor: 'cyan', color: 'red'}}
      />
    );
  };
  const [selectedLanguage, setSelectedLanguage] = useState();

  return (
    <Picker
      ref={pickerRef}
      onValueChange={(itemValue, itemIndex) => {
        setSelectedLanguage(itemValue);
      }}
      style={{height: 52, width: '100%', backgroundColor: 'red'}}
      selectedValue={selectedLanguage}>
      <Picker.Item label="Java" value="java" />
      <Picker.Item label="JavaScript" value="js" />
    </Picker>
  );

  return (
    // <View
    //   style={{
    //     marginTop: mt || 12,
    //     display: 'flex',
    //     width: fullWidth ? '100%' : width ? width : '47%',
    //   }}>
    //   {label && (
    //     <Text
    //       fontType={'Roboto'}
    //       medium
    //       style={{fontSize: 12, marginBottom: 3}}>
    //       {label}
    //     </Text>
    //   )}
    // {Platform.OS === 'ios' ? (
    // <Pressable
    //   onPress={() => setShowIOSSelect(prev => !prev)}
    //   style={styles.select}>
    //   {showIOSSelect ? (
    //     <PickerIOS
    //       style={[
    //         styles.selectIOS,
    //         {
    //           // width: '110%',
    //           // marginLeft: '-5%',
    //           // marginTop: '-50%',
    //         },
    //       ]}
    //       selectionColor="rgba(0,0,0,0.3)"
    //       selectedValue={value}
    //       onValueChange={onChangeValue}>
    //       <Picker.Item label="Java" value="java" />
    //       <Picker.Item label="JavaScript" value="js" />
    //     </PickerIOS>
    //   ) : (
    //     <></>
    //   )}
    // </Pressable>
    // <> </>
    // ) : (
    // <View style={styles.select}>
    //   {/* {list.map(renderItems)}
    // </Picker> */}
    // </View>
    // )}
    //   {!hideError && error && (
    //     <Text
    //       notCapitalized
    //       fontType={'roboto'}
    //       style={{
    //         marginTop: 2,
    //         marginLeft: 4,
    //         fontSize: 12,
    //         color: 'red',
    //       }}>
    //       {error}
    //     </Text>
    //   )}
    // </View>
    (<Picker
      testID="styled-picker"
      ref={pickerRef}
      selectedValue={selectedLanguage}
      onValueChange={(itemValue, itemIndex) => {
        setSelectedLanguage(itemValue);
      }}
      accessibilityLabel="Styled Picker Accessibility Label"
      style={{height: 52, width: '100%', backgroundColor: 'transparent'}}
      useNativeAndroidPickerStyle={false}>
      <Picker.Item label="Java" value="java" />
      <Picker.Item label="JavaScript" value="js" />
    </Picker>)
  );
};

export default Select;

const styles = StyleSheet.create({
  select: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    height: 52,
    backgroundColor: 'transparent',
    borderColor: '#CFD3D4',
  },
  selectIOS: {
    fontSize: 25,
    color: 'red',
    textAlign: 'left',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
});
