import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Icons from "@react-native-vector-icons/material-design-icons";
import Icons2 from "@react-native-vector-icons/material-icons";
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

function StepsTopbar({}) {
  const {completeProfileStage: active, pending} = useSelector(
    state => state.profile,
  );

  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('step1')}
        style={styles.iconContianer}>
        <Icons color="#fff" size={24} name="email-check-outline" />
      </TouchableOpacity>
      <View style={[styles.line, active >= 2 ? null : styles.nonactive]}></View>
      <TouchableOpacity
        onPress={() => navigation.navigate('step2')}
        style={[styles.iconContianer, active >= 2 ? null : styles.nonactive]}>
        <Icons2 color="#fff" size={24} name="add-a-photo" />
      </TouchableOpacity>
      <View style={[styles.line, active >= 3 ? null : styles.nonactive]}></View>
      <TouchableOpacity
        onPress={() => navigation.navigate('step3')}
        style={[styles.iconContianer, active >= 3 ? null : styles.nonactive]}>
        <Icons color="#fff" size={24} name="account-details" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContianer: {
    backgroundColor: '#5143d9',
    justifyContent: 'center',
    alignItems: 'center',
    width: 45,
    height: 45,
    color: 'white',
    borderRadius: 50,
    marginBottom: -22,
  },
  line: {
    flex: 1,
    borderColor: '#5143d9',
    borderBottomWidth: 2,
  },
  nonactive: {
    opacity: 0.5,
  },
  itemgroup: {
    width: '100%',
  },
  row: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  signingroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
});
export default StepsTopbar;
