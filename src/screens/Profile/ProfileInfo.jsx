import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {formatDateOnly} from '../../utils/dateOnly';
import {useFormik} from 'formik';
import Select from '../../components/Inputs/Select';
import {_step3Schema} from '../../utils/validationSchemas';
import Head from '../../components/Shared/Head';
import {uploadUserProfile} from '../../store/actions/profile/uploadUserProfile';
import {useFocusEffect} from '@react-navigation/native';
import {logOut} from '../../store/reducer/userSlice';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import Ionicons from "@react-native-vector-icons/ionicons";
import Text from '../../components/Shared/Text';
import BottomSelect from '../../components/Inputs/BottomSelect';
import {contactSupport} from '../../store/actions/profile/contactSupport';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';
// import {email-outline} from "reacticons"{email-outline}
const ProfileInfo = ({navigation}) => {
  const {t} = useTranslation();
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);

  const {unAuthenticated} = useSelector(state => state.data);
  const {user} = useSelector(state => state.user);
  const dispatch = useDispatch();

  const onSubmit = values => {
    const formData = new FormData();

    formData.append('first_name', values.first_name);
    formData.append('last_name', values.last_name);
    formData.append('other_name', values.other_name);

    formData.append('phone', values?.phone);
    formData.append('dob', values.dob);

    formData.append('email', user?.email);
    formData.append('postal_code', (values?.postal_code || '').replace(/\s/g, ''));
    formData.append('gender_id', values?.gender.id || 0);
    formData.append('address', values?.address);

    formData.append('country_id', values?.country.id);
    formData.append('state_id', values?.state.id);
    formData.append('city_id', values?.city.id);

    dispatch(uploadUserProfile(formData));
  };

  const form = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      other_name: user?.other_name || '',
      dob: formatDateOnly(user?.dob),

      phone: user?.phone || '',

      postal_code: user?.postal_code || '',
      address: user?.address || '',

      gender: user?.gender_id
        ? unAuthenticated?.gender?.find(gender => gender.id === user.gender_id)
        : '',
      city: user?.city_id
        ? unAuthenticated?.cities?.find(c => c.id === user.city_id)
        : '',
      state: user?.state_id
        ? unAuthenticated?.states?.find(s => s.id === user.state_id)
        : '',
      country: user?.country_id
        ? unAuthenticated?.countries?.find(c => c.id === user.country_id)
        : '',
    },
    validationSchema: _step3Schema,
    onSubmit,
  });


  useFocusEffect(useCallback(() => {}, []));

  const gotToEditProfile = (id, title) => {
    navigation.navigate('editprofileinfo', {title: title, itemID: id});
  };
  const [showbottomSheet, setShowbottomSheet] = useState(false);

  const handleContactSupport = () => {
    setShowbottomSheet(false);
    navigation.navigate('contactsupport');
  };

  return (
    <ScreenContainer style={{flex: 1, backgroundColor: '#FFF'}}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',
          borderBottomWidth: 2,
        }}>
        <Head pageTitle={t('profile.profile_information')} type={2} navigation={navigation} />
      </View>
      <KeyboardAvoidingView style={styles.container}>
        <View>
          <Text
            fontType={'roboto'}
            bold
           style={{marginVertical: 8, fontSize: 20, color: '#000', fontWeight: 'bold'}}>{t('profile2.contact_header')}</Text>

          <Pressable
            onPress={() => gotToEditProfile('email', 'Email')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="email-outline" size={30} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {t('profile2.label_email')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.email}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
          <Pressable
            onPress={() => gotToEditProfile('phone', 'Phone')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="phone" size={30} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {t('profile2.label_phone')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.phone}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
          <Pressable
            // onPress={() => setShowbottomSheet(true)}
            onPress={() => gotToEditProfile('address', 'Address')}
            style={styles.listItem}>
           <MaterialCommunityIcons name="home-outline" size={30} color="#000" />
              <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {t('profile2.label_address')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.address}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
        </View>
        <View>
          <Text
            fontType={'roboto'}
            bold
            style={{marginVertical: 8, fontSize: 20, color: '#000', fontWeight: 'bold'}}>{t('profile2.personal_header')}</Text>
          <Pressable
            onPress={() => setShowbottomSheet('Name')}
            // onPress={() => gotToEditProfile('name', 'Name')}
            style={styles.listItem}>
            <Ionicons name="person-outline" size={30} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {t('profile2.label_name')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.name}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowbottomSheet('Gender')}
            // onPress={() => gotToEditProfile('gender', 'Gender')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="email-outline" size={30} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {t('profile2.label_gender')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {
                  unAuthenticated?.gender?.find(
                    gender => gender.id === user.gender_id,
                  )?.name
                }
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowbottomSheet('DOB')}
            // onPress={() => gotToEditProfile('dob', 'DOB')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="email-outline" size={30} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {t('profile2.label_dob')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.dob}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      {showbottomSheet && (
        <BottomSelect
          snapPoints={[220]}
          handleShowbottomSheet={setShowbottomSheet}>
          <Text
            fontType={'roboto'}
            bold
            center
            style={{marginVertical: 8, fontSize: 20, color: '#000'}}>
            {`${showbottomSheet} can't be changed`}
          </Text>
          <Text
            center
            color={'#525354'}
            fontType={'roboto'}
            style={{fontSize: 16}}>{t('profile2.verify_identity_note')}</Text>
          <Button
            pressed={handleContactSupport}
            style={{
              borderRadius: 8,
              marginTop: 8,
              backgroundColor: colors.brandGreen,
            }}
            text={t('profile.contact_support')}
          />
        </BottomSelect>
      )}
    </ScreenContainer>
  );
};

export default ProfileInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 8,
  },
  doubleSelect: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailsItemInner: {
    gap: 2,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginVertical: 8,
    gap: 20,
    borderBottomColor: '#999',
    borderBottomWidth: 1,
  },
});
