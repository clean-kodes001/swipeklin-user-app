import React, {useCallback, useState} from 'react';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Pressable,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageView from 'react-native-image-viewing';
import {useDispatch, useSelector} from 'react-redux';
import Text from '../../components/Shared/Text';
import Head from '../../components/Shared/Head';
import Button from '../../components/Shared/Button';
import Icon from '@react-native-vector-icons/material-icons';
import {logOut} from '../../store/reducer/userSlice';
import {uploadUserProfile} from '../../store/actions/profile/uploadUserProfile';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {colors} from '../../config/colors';
import {useFocusEffect} from '@react-navigation/native';
import AntDesign from '@react-native-vector-icons/ant-design';
import BottomSelect from '../../components/Inputs/BottomSelect';
import {getProfile} from '../../store/actions/profile/getProfile';
import {LOGOUT} from '../../config/apis';
import {Client} from '../../config/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearAllFormData} from '../../utils/formDataStorage';
import {useTranslation} from 'react-i18next';
import {changeLanguage} from '../../i18n/i18n';
import {
  validateAvatarImage,
  showFileValidationError,
} from '../../utils/validateFileSize';
import {showToast} from '../../utils/showToast';

const ProfileScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {user, profilePending} = useSelector(state => state.user);
  const [showModal, setShowModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  const languages = [
    {id: 'en', name: 'English'},
    {id: 'fr', name: 'Français'},
  ];

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await Client({
      method: 'GET',
      path: LOGOUT,
    });
    await AsyncStorage.removeItem('accessToken');
    // Clear all form data on logout
    await clearAllFormData();
    dispatch(logOut());
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: t('common.camera_permission_title'),
          message: t('common.camera_permission_message'),
          buttonNeutral: t('common.ask_me_later'),
          buttonNegative: t('common.cancel'),
          buttonPositive: t('common.ok'),
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const handleUploadImage = async type => {
    // Request camera permission for Android before launching camera
    if (type === 'camera' && Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        showToast({
          type: 0,
          title: t('common.permission_denied_title'),
          message: t('common.camera_permission_denied_message'),
        });
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };
    try {
      let image;
      if (type === 'camera') {
        image = await launchCamera(options);
      } else if (type === 'library') {
        image = await launchImageLibrary(options);
      }
      if (image?.assets && image.assets.length > 0 && image.assets[0]?.uri) {
        // Validate file size and format
        const validation = validateAvatarImage(image);
        if (!validation.isValid) {
          showFileValidationError(validation.error);
          return;
        }
        const assetUri = image.assets[0].uri;
        // Handle URI for both iOS and Android
        const uri =
          Platform.OS === 'android'
            ? assetUri
            : assetUri.replace('file://', '');
        const filename = assetUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const ext = match?.[1] || 'jpg';
        const imageType = match ? `image/${match[1]}` : 'image/jpeg';
        const avatar = {uri, name: `image.${ext}`, type: imageType};
        const formData = new FormData();
        formData.append('avatar', avatar);
        formData.append('first_name', user?.first_name || '');
        formData.append('last_name', user?.last_name || '');
        formData.append('phone', user?.phone || '');
        formData.append('dob', user?.dob || '');
        formData.append('email', user?.email || '');
        formData.append(
          'postal_code',
          (user?.postal_code || '').replace(/\s/g, ''),
        );
        formData.append('gender_id', user?.gender_id || 0);
        formData.append('address', user?.address || '');
        formData.append('country_id', user?.country_id || '');
        formData.append('state_id', user?.state_id || '');
        formData.append('city_id', user?.city_id || '');

        dispatch(uploadUserProfile({data: formData}));
      }
    } catch (error) {
      console.log('Image picker error:', error);
      if (
        error?.code === 'E_PERMISSION_MISSING' ||
        error?.message?.includes('permission')
      ) {
        showToast({
          type: 0,
          title: t('common.permission_denied_title'),
          message: t('common.camera_permission_denied_message'),
        });
      }
    }
  };

  const showCamera = () => {
    handleUploadImage('camera');
    setShowModal(false);
  };
  const showLibrary = () => {
    handleUploadImage('library');
    setShowModal(false);
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(getProfile());
    }, [dispatch]),
  );

  const handleRenderLanguages = (item, index) => {
    const isActive = i18n.language === item.id;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          changeLanguage(item.id);
          setShowLanguageSheet(false);
        }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 4,
          width: '100%',
          backgroundColor: isActive ? colors.primary : '#fff',
          paddingVertical: 16,
          paddingHorizontal: 20,
        }}>
        <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
          <FontAwesome
            name={isActive ? 'dot-circle-o' : 'circle-o'}
            size={20}
            color={isActive ? '#fff' : colors.primary}
          />
          <Text
            fontType={'roboto'}
            style={{fontSize: 16, color: isActive ? '#fff' : colors.primary}}>
            {item.name}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          color={isActive ? '#fff' : colors.primary}
          size={26}
        />
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{t('profile2.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        <View style={styles.top}>
          <Head pageTitle={t('profile.title')} type={2} navigation={navigation} />
          <TouchableOpacity
            onPress={() => setShowImageViewer(true)}
            style={styles.imageContainer}>
            <Image style={styles.image} source={{uri: user?.avatar || ''}} />
          </TouchableOpacity>
          <Text
            capitalized
            fontType={'roboto'}
            semibold
            style={{
              textTransform: 'capitalize',
              fontSize: 20,
              color: '#333333',
              marginTop: 2,
            }}>
            {user?.name || ''}
          </Text>
          <Text
            fontType={'roboto'}
            semibold
            style={{fontSize: 14, color: '#ABAFB1'}}>
            {user?.email || ''}
          </Text>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 4,
            }}>
            <View
              style={{
                flexDirection: 'row',
                gap: 2,

                alignItems: 'center',
              }}>
              {[1, 2, 3, 4, 5].map(index => (
                <View key={index}>
                  <FontAwesome
                    style={{color: '#F8C22E'}}
                    name={index <= Number(user?.rating) ? 'star' : 'star-o'}
                    // name={true ? 'star' : 'star-o'}
                    size={18}
                  />
                </View>
              ))}
            </View>
            <Text fontType={'roboto'} bold style={{fontSize: 20}}>
              {user?.rating}
            </Text>
          </View>
          <Button
            disabled={profilePending}
            pressed={() => navigation.navigate('profileinfo')}
            height={42}
            style={{width: 155, borderRadius: 8, marginTop: 12}}
            text={t('common.edit_profile')}
          />
          <View
            style={{
              height: 64,
              backgroundColor: '#f3f5f7',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 12,
              // width: '100%',
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity
              disabled={profilePending}
              onPress={() => setShowModal(true)}
              style={{
                borderRadius: 8,

                width: 150,
                height: '100%',
                backgroundColor: '#dcd9f7',
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              <Text
                fontType={'roboto'}
                semibold
                style={{fontSize: 16, color: '#5143d9'}}>
                {t('profile.change_picture')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={profilePending}
              onPress={handleLogout}
              style={{
                backgroundColor: '#AC2D26',
                borderRadius: 8,
                flex: 1,
                width: 150,
                height: '100%',
                display: 'flex',
                gap: 4,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              <Icon name="logout" size={18} color={'#FFF'} />
              <Text
                fontType={'roboto'}
                semibold
                style={{fontSize: 14, color: '#FFF'}}>
                {t('common.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.btm}>
          <View style={styles.inner}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <MaterialCommunityIcons
                  name="globe-model"
                  color={colors.primary}
                  size={30}
                />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.country')}
                </Text>
              </View>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                {user?.site_country_id === 2 ? (
                  <Image
                    source={require('../../assets/media/images/naija.svg.png')}
                    style={{width: 40, height: 20}}
                  />
                ) : user?.site_country_id === 1 ? (
                  <Image
                    source={require('../../assets/media/images/canada.png')}
                    style={{width: 40, height: 20}}
                  />
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowLanguageSheet(true)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center'}}>
                <MaterialCommunityIcons
                  name="translate"
                  color={colors.primary}
                  size={28}
                />
                <Text fontType={'roboto'} style={{fontSize: 16}}>
                  {t('profile.language')}
                </Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Text fontType={'roboto'} style={{fontSize: 14, color: '#888'}}>
                  {i18n.language === 'fr' ? 'Français' : 'English'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" color={'#444'} size={26} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('paymentmethod')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign
                  name="credit-card"
                  color={colors.primary}
                  size={24}
                />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.my_cards')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('contactus')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign name="mail" color={colors.primary} size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.contact_us')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('invitefriends')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign name="team" color={colors.primary} size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.invite_friends')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (
                    typeof window !== 'undefined' &&
                    window.confirm(
                      t('profile.delete_account_confirm'),
                    )
                  ) {
                    window.location.href = 'https://swipeklin.com/data-safety';
                  }
                } else {
                  Alert.alert(
                    t('profile.delete_account_title'),
                    t('profile.delete_account_confirm'),
                    [
                      {
                        text: t('common.cancel'),
                        style: 'cancel',
                      },
                      {
                        text: t('profile.delete_account_proceed'),
                        onPress: () => {
                          Linking.openURL('https://swipeklin.com/data-safety');
                        },
                      },
                    ],
                  );
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign name="delete" color="red" size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    color: 'red',
                  }}>
                  {t('profile.delete_account')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ImageView
        images={[{uri: user?.avatar || ''}]}
        imageIndex={0}
        visible={showImageViewer}
        onRequestClose={() => setShowImageViewer(false)}
        FooterComponent={() => (
          <View style={{paddingBottom: 48, paddingHorizontal: 24, alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => {
                setShowImageViewer(false);
                setShowModal(true);
              }}
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.4)',
              }}>
              <Text fontType={'roboto'} style={{color: '#fff', fontSize: 16}}>
                {t('profile.change_picture')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {showModal && (
        <>
          <Pressable
            onPress={() => setShowModal(false)}
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              position: 'absolute',
              bottom: 0,
              top: 0,
              height: '100%',
              width: '100%',
            }}
          />
          <View
            style={{
              backgroundColor: '#fff',
              position: 'absolute',
              bottom: 70,

              width: '90%',
              marginHorizontal: '5%',

              borderRadius: 16,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}>
            <Button
              text={t('common.take_selfie')}
              pressed={showCamera}
              height={52}
              style={{width: '80%'}}
            />
            <Button
              outline
              text={t('common.choose_picture')}
              pressed={showLibrary}
              height={52}
              style={{width: '80%'}}
            />
          </View>
        </>
      )}
      {showLanguageSheet && (
        <BottomSelect snapPoints={[250]} handleShowbottomSheet={setShowLanguageSheet}>
          {languages.map(handleRenderLanguages)}
        </BottomSelect>
      )}
    </ScreenContainer>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  top: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
  },
  imageContainer: {
    marginTop: 8,
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#b9b3ef',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  btm: {
    backgroundColor: '#f3f5f7',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  inner: {
    borderRadius: 8,
  },
});
