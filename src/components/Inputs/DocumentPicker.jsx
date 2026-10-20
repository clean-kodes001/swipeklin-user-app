import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../Shared/Text';
import DocumentPicker, {
  isCancel,
  isInProgress,
  types,
} from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import Feather from '@react-native-vector-icons/feather';
import {
  validateOnboardingDocument,
  validateChatImage,
  validateContactDocument,
  showFileValidationError,
  validateCleanerDocument,
} from '../../utils/validateFileSize';
import {useTranslation} from 'react-i18next';

const DocumentPickerRN = ({
  label,
  style,
  noPlaceHolder,
  miltiple,
  mt,
  error,
  hideError,
  onChangeValue,
  small,
  mainStyle,
  documentUrl,
  value,
  type, // 'image' for images, undefined for documents
  validationType, // 'onboarding', 'chat', 'contact', 'cleaner' or undefined
  onBlur,
  maxSize, // legacy prop support
}) => {
  const {t} = useTranslation();
  const [result, setResult] = React.useState();
  const hasUserInteractedRef = React.useRef(false);
  const isInitialMountRef = React.useRef(true);

  // Map legacy maxSize to validationType if not provided
  const effectiveValidationType = validationType || maxSize;

  // Sync result state with value prop (for prefilled data) - only on initial mount or when value changes from null to non-null
  useEffect(() => {
    // Only sync from value prop if:
    // 1. It's the initial mount (isInitialMountRef.current === true)
    // 2. OR value is changing from null/undefined to a non-null value (prefilling)
    // 3. AND user hasn't interacted yet (hasUserInteractedRef.current === false)
    if (isInitialMountRef.current || (!hasUserInteractedRef.current && value && !result)) {
      if (value) {
        setResult(value);
      }
      isInitialMountRef.current = false;
    }
  }, [value]);

  useEffect(() => {
    // Only forward to the parent when the change came from a genuine user
    // action (camera/picker), never from the prop-sync effect above hydrating
    // `result` from a prefilled `value` (e.g. a server-confirmed upload after
    // login) — see SwipeKlin_Cleaner_v2's DocumentPicker.jsx for the bug this
    // guards against (BUG-0023).
    if (result !== undefined && hasUserInteractedRef.current) {
      onChangeValue(result);
    }
  }, [result]);
  const handleError = err => {
    if (isCancel(err)) {
      console.warn('cancelled');
      // User cancelled the picker, exit any dialogs or menus and move on
    } else if (isInProgress(err)) {
      console.warn(
        'multiple pickers were opened, only the last will be considered',
      );
    } else {
      throw err;
    }
  };

  const openPicker = async () => {
    try {
      const pickerResult = await DocumentPicker.pickSingle({
        presentationStyle: 'fullScreen',
        copyTo: 'cachesDirectory',
        type: [types.pdf, types.doc, types.images, types.docx],
      });
      
      // Log for debugging Android issues
      console.log('DocumentPicker result:', {
        name: pickerResult?.name,
        size: pickerResult?.size,
        fileSize: pickerResult?.fileSize,
        type: pickerResult?.type,
        uri: pickerResult?.uri?.substring(0, 50),
        validationType: effectiveValidationType,
        platform: Platform.OS,
      });
      
      // On Android, DocumentPicker might not provide size immediately
      // If size is not available, we'll allow it (backend will validate)
      const hasSizeInfo = pickerResult?.size || pickerResult?.fileSize;
      
      // Validate based on validationType (only if size info is available)
      let validation = { isValid: true };
      
      if (hasSizeInfo) {
        if (effectiveValidationType === 'contact') {
          validation = validateContactDocument([pickerResult]);
        } else if (effectiveValidationType === 'onboarding') {
          validation = validateOnboardingDocument([pickerResult]);
        } else if (effectiveValidationType === 'cleaner') {
          validation = validateCleanerDocument([pickerResult]);
        } else if (effectiveValidationType === 'chat') {
           // validateChatImage returns object with isValid, unlike others which return object, 
           // but check existing implementation pattern
           const isValid = validateChatImage([pickerResult]);
           validation = { isValid, error: 'File too large' }; // simplified as validateChatImage might work differently
        }
        // Default: validate as onboarding document (9MB) if no type specified
        else if (!effectiveValidationType) {
          validation = validateOnboardingDocument([pickerResult]);
        }
      } else {
        // No size info available (common on Android) - allow it, backend will validate
        console.log('No file size info available, allowing document (backend will validate)');
        validation = { isValid: true };
      }
      
      if (validation.isValid) {
        hasUserInteractedRef.current = true; // Mark that user has interacted
        setResult([pickerResult]);
      } else {
        // Validation failed - log for debugging
        console.warn('Document validation failed:', {
          name: pickerResult?.name,
          size: pickerResult?.size,
          fileSize: pickerResult?.fileSize,
          validationType: effectiveValidationType,
          error: validation.error
        });
        showFileValidationError(validation.error);
      }
    } catch (e) {
      handleError(e);
    }
  };
  const openPickMiltiple = async () => {
    try {
      const pickerResult = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        copyTo: 'cachesDirectory',
        allowMultiSelection: true,
        type: [types.images],
      });

      // Validate based on validationType
      let isValid = true;
      let errorMsg = '';

      if (effectiveValidationType === 'chat') {
        isValid = validateChatImage(pickerResult);
      } else if (effectiveValidationType === 'onboarding') {
        const v = validateOnboardingDocument(pickerResult);
        isValid = v.isValid;
        errorMsg = v.error;
      } else if (effectiveValidationType === 'cleaner') {
        const v = validateCleanerDocument(pickerResult);
        isValid = v.isValid; 
        errorMsg = v.error;
      } else if (effectiveValidationType === 'contact') {
        const v = validateContactDocument(pickerResult);
        isValid = v.isValid;
        errorMsg = v.error;
      }
      // Default: validate as chat image (9MB) for multiple image selection
      else if (!effectiveValidationType) {
        isValid = validateChatImage(pickerResult);
      }

      if (isValid) {
        hasUserInteractedRef.current = true; // Mark that user has interacted
        setResult(pickerResult);
      } else {
         if (errorMsg) showFileValidationError(errorMsg);
      }
    } catch (e) {
      handleError(e);
    }
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      // Check Android version for appropriate permission
      const androidVersion = Platform.Version;

      // Check if camera permission is already granted
      const cameraCheck = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      if (cameraCheck) {
        // Camera permission already granted, return true
        // Storage permission is nice to have but not critical for camera
        return true;
      }

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

      const cameraGranted =
        granted === PermissionsAndroid.RESULTS.GRANTED;

      if (!cameraGranted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera permission is required to take photos. Please enable it in Settings.',
          [{text: 'OK'}],
        );
        return false;
      }

      return cameraGranted;
    } catch (err) {
      console.warn('Permission request error:', err);
      // Don't block camera on permission error, let react-native-image-picker handle it
      return true;
    }
  };

  const normalizeImageResult = asset => {
    // Normalize image picker result to match document picker format
    // processImageUri expects fileCopyUri for type 'file'

    if (!asset?.uri) {
      console.warn('normalizeImageResult: Missing uri in asset', asset);
      return null;
    }

    // For Android, keep the URI as-is (it's usually file:// or content://)
    // For iOS, remove file:// prefix for uri but keep it for fileCopyUri
    let processedUri = asset.uri;
    let fileCopyUri = asset.uri;

    if (Platform.OS === 'android') {
      // Android URIs from react-native-image-picker are typically file:// URIs
      // Keep them as-is for both uri and fileCopyUri
      processedUri = asset.uri;
      fileCopyUri = asset.uri;
    } else {
      // iOS: remove file:// prefix for uri, but ensure fileCopyUri has it
      processedUri = asset.uri.replace('file://', '');
      if (!fileCopyUri.startsWith('file://')) {
        fileCopyUri = `file://${fileCopyUri}`;
      }
    }

    // Extract filename from URI if fileName is not provided
    let fileName = asset.fileName;
    if (!fileName && asset.uri) {
      const uriParts = asset.uri.split('/');
      fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;
    }

    return {
      name: fileName || `photo_${Date.now()}.jpg`,
      uri: processedUri,
      fileCopyUri: fileCopyUri,
      type: asset.type || 'image/jpeg',
      size: asset.fileSize || asset.size || 0,
      fileSize: asset.fileSize || asset.size || 0, // Keep both for compatibility
      base64: asset.base64 || null, // Include base64 if available for persistence
    };
  };

  const openCamera = async () => {
    console.log('openCamera ===> ');
    try {
      // Request permissions first (Android only)
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        console.log('Camera permission denied');
        return;
      }

      // Use simple options like Step2.jsx which works
      const cameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true, // Include base64 for persistence
      };

      const cameraResult = await launchCamera(cameraOptions);
      console.log('cameraResult ===> ', cameraResult);

      // Check for errors in result
      if (cameraResult?.errorCode) {
        const errorCode = cameraResult.errorCode;
        const errorMessage = cameraResult.errorMessage || 'Unknown error';

        console.warn('Camera error:', errorCode, errorMessage);
        if (
          errorCode === 'camera_unavailable' ||
          errorCode === 'permission' ||
          errorMessage?.toLowerCase().includes('camera') ||
          errorMessage?.toLowerCase().includes('permission')
        ) {
          Alert.alert(
            'Camera Not Available',
            errorMessage ||
              'Camera is not available. Would you like to choose a photo from your library instead?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Choose Photo',
                onPress: openImageLibrary,
              },
            ],
          );
        } else {
          Alert.alert(t('common.camera_error_title'), errorMessage || 'Unable to open camera.');
        }
        return;
      }

      // Check if user cancelled
      if (cameraResult?.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      // Process successful result
      if (cameraResult?.assets && cameraResult.assets.length > 0) {
        const asset = cameraResult.assets[0];
        console.log('Camera asset:', asset);
        const normalizedResult = normalizeImageResult(asset);
        if (normalizedResult) {
          // Log for debugging
          console.log('Camera normalized result:', {
            name: normalizedResult?.name,
            size: normalizedResult?.size,
            fileSize: normalizedResult?.fileSize,
            type: normalizedResult?.type,
            validationType: effectiveValidationType,
            platform: Platform.OS,
          });
          
          // Check if size info is available
          const hasSizeInfo = normalizedResult?.size || normalizedResult?.fileSize;
          
          // Validate based on validationType (only if size info is available)
          let validation = { isValid: true };
          
          if (hasSizeInfo) {
            if (effectiveValidationType === 'chat') {
              const isValid = validateChatImage([normalizedResult]);
              validation = { isValid };
            } else if (effectiveValidationType === 'contact') {
              validation = validateContactDocument([normalizedResult]);
            } else if (effectiveValidationType === 'onboarding') {
              validation = validateOnboardingDocument([normalizedResult]);
            } else if (effectiveValidationType === 'cleaner') {
              validation = validateCleanerDocument([normalizedResult]);
            }
            // If type is 'image' and no validationType specified, validate as chat image (9MB)
            else if (type === 'image' && !effectiveValidationType) {
              const isValid = validateChatImage([normalizedResult]);
              validation = { isValid };
            }
          } else {
            // No size info available - allow it, backend will validate
            console.log('No file size info available for camera image, allowing (backend will validate)');
            validation = { isValid: true };
          }
          
          if (validation.isValid) {
            hasUserInteractedRef.current = true; // Mark that user has interacted
            setResult([normalizedResult]);
          } else {
            console.warn('Camera image validation failed:', {
              name: normalizedResult?.name,
              size: normalizedResult?.size,
              fileSize: normalizedResult?.fileSize,
              validationType: effectiveValidationType,
              error: validation.error
            });
            showFileValidationError(validation.error);
          }
        } else {
          console.warn('Failed to normalize camera result');
          Alert.alert(t('camera.error_title'), t('camera.failed_to_process'));
        }
      } else {
        console.warn('No assets in camera result:', cameraResult);
      }
    } catch (e) {
      console.error('Camera exception:', e);
      // Show error to user
      const errorMessage =
        e?.message || e?.toString() || 'Unable to open camera';
      Alert.alert(
        t('common.camera_error_title'),
        errorMessage +
          '. ' + t('common.camera_unavailable_choose_gallery'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.choose_from_gallery'),
            onPress: openImageLibrary,
          },
        ],
      );
    }
  };

  const openImageLibrary = async () => {
    try {
      const libraryResult = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        includeBase64: true, // Include base64 for persistence
      });

      if (libraryResult?.assets && libraryResult.assets.length > 0) {
        const asset = libraryResult.assets[0];
        const normalizedResult = normalizeImageResult(asset);
        if (normalizedResult) {
          // Log for debugging Android issues
          console.log('ImageLibrary result:', {
            name: normalizedResult?.name,
            size: normalizedResult?.size,
            fileSize: normalizedResult?.fileSize,
            type: normalizedResult?.type,
            validationType: effectiveValidationType,
            platform: Platform.OS,
          });
          
          // Check if size info is available
          const hasSizeInfo = normalizedResult?.size || normalizedResult?.fileSize;
          
          // Validate based on validationType (only if size info is available)
          let validation = { isValid: true };
          
          if (hasSizeInfo) {
            if (effectiveValidationType === 'chat') {
              const isValid = validateChatImage([normalizedResult]);
              validation = { isValid };
            } else if (effectiveValidationType === 'contact') {
              validation = validateContactDocument([normalizedResult]);
            } else if (effectiveValidationType === 'onboarding') {
              validation = validateOnboardingDocument([normalizedResult]);
            } else if (effectiveValidationType === 'cleaner') {
              validation = validateCleanerDocument([normalizedResult]);
            }
            // If type is 'image' and no validationType specified, validate as chat image (9MB)
            else if (type === 'image' && !effectiveValidationType) {
              const isValid = validateChatImage([normalizedResult]);
              validation = { isValid };
            }
          } else {
            // No size info available - allow it, backend will validate
            console.log('No file size info available for image, allowing (backend will validate)');
            validation = { isValid: true };
          }
          
          if (validation.isValid) {
            hasUserInteractedRef.current = true; // Mark that user has interacted
            setResult([normalizedResult]);
          } else {
            console.warn('Image validation failed:', {
              name: normalizedResult?.name,
              size: normalizedResult?.size,
              fileSize: normalizedResult?.fileSize,
              validationType: effectiveValidationType,
              error: validation.error
            });
            showFileValidationError(validation.error);
          }
        }
      }
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') {
        console.warn('Image library error:', e);
        Alert.alert(t('camera.error_title'), t('camera.unable_to_open_library'));
      }
    }
  };

  return (
    <View
      style={{
        marginTop: mt || 12,
        display: 'flex',

        // width: '47%',
        width: '100%',
      }}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={{fontSize: 12, marginBottom: 3}}>
          {label}
        </Text>
      )}

      <View style={[styles.select, mainStyle]}>
        <View
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <View
            style={{
              flex: 2,
            }}>
            <Icon
              style={{color: '#302882'}}
              size={small ? 19 : 25}
              name="document-text-outline"
            />
            {value && value[0]?.name && (
              <Icon
                style={{color: '#00ac47'}}
                size={small ? 19 : 25}
                name="checkmark-circle-outline"
              />
            )}
            <Text
              singleLine
              style={{
                color: '#302882',
                textAlign: 'left',
                fontSize: small ? 12 : 14,
                fontFamily: 'Roboto-Regular',
              }}>
              {documentUrl
                ? 'Uploaded'
                : value && value[0]?.name
                ? 'Selected'
                : noPlaceHolder
                ? ''
                : 'Please upload a file'}
            </Text>
          </View>
          {documentUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(documentUrl)}
              style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                style={{color: '#302882'}}
                name="eye-outline"
                size={small ? 18 : 24}
                color="black"
              />

              <Text style={{fontSize: small ? 12 : 14}} color={'#302882'}>{t('documents.view')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              console.log('Camera button pressed');
              openCamera();
            }}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon
              style={{color: '#302882'}}
              name="camera-outline"
              size={small ? 18 : 24}
            />

            <Text style={{fontSize: small ? 12 : 14}} color={'#302882'}>{t('documents.camera_button')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={miltiple ? openPickMiltiple : openPicker}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Feather
              style={{color: '#302882'}}
              size={small ? 18 : 24}
              name="upload-cloud"
            />

            <Text style={{fontSize: small ? 12 : 14}} color={'#302882'}>{t('documents.upload_button')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!hideError && error && (
        <Text fontType={'roboto'} style={styles.borderErrorStyle}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default DocumentPickerRN;

const styles = StyleSheet.create({
  select: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 12,
    height: 100,
    gap: 8,

    borderColor: '#302882',
    display: 'flex',
    backgroundColor: 'transparent',
    paddingRight: 4,
    paddingLeft: 20,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  borderErrorStyle: {
    marginTop: 2,
    marginLeft: 4,
    fontSize: 12,
    color: 'red',
  },
});
