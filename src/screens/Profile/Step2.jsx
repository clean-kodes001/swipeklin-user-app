import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import {uploadImage} from '../../store/actions/profile/uploadImage';
import Text from '../../components/Shared/Text';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {saveStep2Data, loadStep2Data} from '../../utils/formDataStorage';
import {debounce} from '../../utils/debounce';
import {
  validateAvatarImage,
  showFileValidationError,
} from '../../utils/validateFileSize';
import {showToast} from '../../utils/showToast';
import {useTranslation} from 'react-i18next';

const Step2 = ({navigation, route}) => {
  const {t} = useTranslation();
  const {user} = useSelector(state => state.user);

  const [image, setImage] = useState(null);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);

  const dispatch = useDispatch();

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingSavedData(true);
      const savedData = await loadStep2Data();
      if (savedData) {
        setImage(savedData);
      }
      setIsLoadingSavedData(false);
    };
    loadData();
  }, []);

  // Reload saved data when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const savedData = await loadStep2Data();
        if (savedData) {
          setImage(savedData);
        }
      };
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Debounced save function
  const debouncedSaveRef = useRef(
    debounce(async data => {
      await saveStep2Data(data);
    }, 500),
  );

  const handleNext = async () => {
    let avatar;
    if (image && image.assets && image.assets.length > 0) {
      const assetUri = image.assets[0].uri;
      // Handle URI for both iOS and Android
      const uri =
        Platform.OS === 'android' ? assetUri : assetUri.replace('file://', '');
      const filename = assetUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match?.[1] || 'jpg';
      const imageType = match ? `image/${match[1]}` : 'image/jpeg';
      avatar = {uri, name: `image.${ext}`, type: imageType};
    }

    try {
      dispatch(
        uploadImage({
          nextStage: 3,
          navigation,
          data: {avatar, localAvatar: image},
          nextPage: 'step3',
        }),
      );
      // Don't clear data here - let it persist so user can navigate back
      // Data will be cleared after successful profile submission in Step3
    } catch (error) {
      // Don't clear on error - user can retry
      console.error('Error uploading image:', error);
    }
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
          title: 'Camera Permission',
          message: t('common.camera_permission_message'),
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const handlePressed = async type => {
    // Request camera permission for Android before launching camera
    if (type === 'camera' && Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        showToast({
          type: 0,
          message: t('common.camera_permission_required'),
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
      let result;
      if (type === 'camera') {
        result = await launchCamera(options);
      } else if (type === 'library') {
        result = await launchImageLibrary(options);
      }
      if (result?.assets && result.assets.length > 0) {
        // Validate file size and format
        const validation = validateAvatarImage(result);
        console.log('validation', validation);
        if (!validation.isValid) {
          showFileValidationError(validation.error);
          return;
        }
        setImage(result);
        // Save image data
        debouncedSaveRef.current(result);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      if (
        error?.code === 'E_PERMISSION_MISSING' ||
        error?.message?.includes('permission')
      ) {
        showToast({
          type: 0,
          message: t('common.camera_permission_required'),
        });
      }
    }
  };

  const [showModal, setShowModal] = useState(false);

  const showCamera = () => {
    handlePressed('camera');
    setShowModal(false);
  };
  const showLibrary = () => {
    handlePressed('library');
    setShowModal(false);
  };

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <StepsTopbar />

      <View style={styles.base}>
        <View
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            height: '75%',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              width: 250,
              height: 250,
              borderRadius: 125,
              position: 'relative',
              borderWidth: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderColor: '#b9b3ef',
              overflow: 'hidden',
            }}>
            {!isLoadingSavedData && (image?.assets?.[0]?.uri || user?.avatar) && (
              <Image
                style={{
                  width: user?.avatar && !image ? '105%' : '100%',
                  height: user?.avatar && !image ? '105%' : '100%',
                }}
                source={{uri: image?.assets?.[0]?.uri || user?.avatar}}
              />
            )}
            {!image && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}></View>
            )}
            {!image && (
              <Text
                fontType={'roboto'}
                bold
                center
                style={{fontSize: 14, color: '#fff', position: 'absolute'}}>
                {t('step2.click_to_add_picture')}
              </Text>
            )}
          </TouchableOpacity>

          <Button
            text={t('step2.next')}
            pressed={handleNext}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
        </View>
      </View>

      {showModal && (
        <>
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              position: 'absolute',
              bottom: 0,
              top: 0,
              height: '100%',
              width: '100%',
            }}></TouchableOpacity>
          <View
            style={{
              backgroundColor: '#fff',
              position: 'absolute',
              bottom: 0,
              marginBottom: 12,
              width: '100%',
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
    </ScreenContainer>
  );
};

export default Step2;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
  },
});
