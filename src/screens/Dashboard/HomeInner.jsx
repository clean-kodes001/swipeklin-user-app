import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Pressable,
  PermissionsAndroid,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Text from '../../components/Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  TouchableOpacity as BottomSheetTouchableOpacity,
} from '@gorhom/bottom-sheet';
import MapView, {Marker} from 'react-native-maps';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {useFormik} from 'formik';
import {doubleSelectStyle, flexBetween} from '../../config/styles';
import Select from '../../components/Inputs/Select';
import NumberSelect from '../../components/Inputs/NumberSelect';
import IconButton from '../../components/Buttons/IconButton';
import FuntionButton from '../../components/Buttons/FuntionButton';
import GooglePlacesInput from '../../components/Inputs/GooglePlacesAutoComplete';
import Geolocation from '@react-native-community/geolocation';

import Datepicker from '../../components/Inputs/DatePicker';
import {cleanCalculate} from '../../store/actions/dashboard/cleanCalculate';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {combineTimeAndDate} from '../../utils/timeformatter';
import {formatDateOnly} from '../../utils/dateOnly';
import {ScheduleOccurrenceData} from '../../utils/data';
import Details from '../../components/Containers/Details';
import DetailsText1 from '../../components/Texts/DetailsText1';
import DetailsText3 from '../../components/Texts/DetailsText3';
import DetailsText2 from '../../components/Texts/DetailsText2';
import Modal1 from '../../components/Modals/Modal1';
import {showToast} from '../../utils/showToast';
import {MAX_ACCURACY_M} from '../../utils/locationFilter';
import {useReducedMotion} from 'react-native-reanimated';
import Loading from '../../components/Shared/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';

const {width, height} = Dimensions.get('window');

// Storage key for saved location
const STORAGE_KEY_LOCATION = 'saved_user_location';
const STORAGE_KEY_RECENT = 'user_recent_addresses';

// Custom Button for use inside BottomSheet (uses gesture-handler compatible touchable)
const BottomSheetButton = ({text, onPress, disabled, style, outline}) => (
  <BottomSheetTouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={{
      height: 40,
      borderWidth: outline ? 2 : 0,
      borderRadius: 8,
      borderColor: outline ? '#5143d9' : 'transparent',
      backgroundColor: disabled
        ? 'rgba(81, 67, 217, 0.7)' // Purple with 70% opacity when disabled
        : outline
        ? 'transparent'
        : '#5143d9', // Full purple when enabled
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      ...style,
    }}>
    <Text
      bold
      fontType={'roboto'}
      style={{
        fontSize: 16,
        color: outline ? '#5143d9' : '#fff',
      }}>
      {text}
    </Text>
  </BottomSheetTouchableOpacity>
);

const HomeInner = ({}) => {
  const {t} = useTranslation();
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'playServices',
  });
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {authenticated: authenticatedData} = useSelector(state => state.data);
  const {user, clean} = useSelector(state => state.user);

  const [recentAddresses, setRecentAddresses] = useState([]);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [position, setPosition] = useState(false);
  const [myPosition, setMyPosition] = useState(null);
  const [step, setStep] = useState(1);
  const [mapKey, setMapKey] = useState(0);

  const bottomSheetRef = useRef();
  // const snapPoints = useMemo(() => [220, '100%'], []);
  // const snapPoints = useMemo(() => [270, '100%'], []);

  const snapPoints = useMemo(() => [270, '100%'], []);
  const mapStyle = [];

  const form = useFormik({
    initialValues: {
      state_id: null,
      cleaners: 1,
      schedule_date: formatDateOnly(new Date()),
      schedule_time: null,

      bedrooms: 1,
      bedrooms_min: 1,
      washrooms: 1,
      washrooms_min: 1,
      kitchens: 0,
      otherrooms: 0,

      livingrooms: 0,
      dinningrooms: 0,
      laundryrooms: 0,
      officerooms: 0,

      refridgerator: 0,
      stove: 0,
      dish_washer: 0,
      microwave: 0,

      type: 0,
      notes: '',
      occurrence: ScheduleOccurrenceData?.find(i => i.id === 0),
    },
    onSubmit: values => {
      const data = {
        state_id: values?.state_id,
        location: values?.location_name,
        position: {
          lat: location?.latitude,
          lng: location?.longitude,
        },
        clean_type_id: values.clean_type?.id,
        cleaners: values?.cleaners,

        bedrooms: values?.bedrooms,
        washrooms: values?.washrooms,
        kitchens: values?.kitchens,
        otherrooms: values?.otherrooms,

        livingrooms: values?.livingrooms,
        dinningrooms: values?.dinningrooms,
        laundryrooms: values?.laundryrooms,
        officerooms: values?.officerooms,

        extras: {
          refridgerator: values?.refridgerator,
          stove: values?.stove,
          dish_washer: values?.dish_washer,
          microwave: values?.microwave,
        },
        notes: values?.notes,
        amount: 0,
        type: values?.type,
        frequency: values?.type === 1 ? values?.frequency?.id : 0,
        occurrence: values?.type === 1 ? 1 : 0,
        schedule_date:
          values?.type === 1 || values?.type === 2
            ? combineTimeAndDate(values?.schedule_date, values?.schedule_time)
            : '',
      };

      // BUG-008: validate the schedule date up front (before the cost/checkmark screen).
      // Mirrors the backend rule (schedule must be >= 5 min ahead) for scheduled types 1 & 2.
      if (
        (values?.type === 1 || values?.type === 2) &&
        new Date(data.schedule_date).getTime() < Date.now() + 5 * 60 * 1000
      ) {
        showToast({type: 0, message: t('home.schedule_5_min_ahead')});
        return;
      }

      dispatch(cleanCalculate({data, navigation}));
    },
  });

  const handleNext = () => {
    setStep(prev => ++prev);
  };
  const handleGoBack = async () => {
    if (step === 1) {
      // Clear address and revert to initial state (saved device location)
      const saved = await loadStoredLocation();
      if (saved) {
        setLocation(saved);
        setMyPosition(saved);
      } else {
        setLocation(null);
        setMyPosition(null);
        getLocation();
      }
      form.setFieldValue('location_name', '');
      form.setFieldValue('state_id', null);
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      setStep(prev => --prev);
    }
  };

  const requestLocationPermissionIos = async () => {
    return new Promise((resolve, reject) => {
      Geolocation.requestAuthorization(
        () => {
          // Add delay after permission grant to allow iOS to initialize location services
          setTimeout(() => {
            resolve('granted');
          }, 500);
        },
        error => {
          resolve('');
        },
      );
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_RECENT);
        if (saved) setRecentAddresses(JSON.parse(saved));
      } catch (e) {}
    })();
  }, []);

  const saveRecentAddress = async ({formatted_address, lat, lng, state}) => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY_RECENT);
      const parsed = existing ? JSON.parse(existing) : [];
      const filtered = parsed.filter(
        a => a.formatted_address !== formatted_address,
      );
      const updated = [{formatted_address, lat, lng, state}, ...filtered].slice(
        0,
        5,
      );
      await AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      setRecentAddresses(updated);
    } catch (e) {}
  };

  // Save location to AsyncStorage
  const saveLocation = useCallback(async region => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(region));
    } catch (error) {
      console.warn('Error saving location:', error);
    }
  }, []);

  // Load location from AsyncStorage
  const loadStoredLocation = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_LOCATION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
      return null;
    } catch (error) {
      console.warn('Error loading stored location:', error);
      return null;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      let granted;
      if (Platform.OS === 'ios') {
        granted = await requestLocationPermissionIos();
      } else {
        // Request both fine and coarse location permissions for Android
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('common.geolocation_permission_title'),
            message: t('common.geolocation_permission_message'),
            buttonNeutral: t('common.ask_me_later'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('common.ok'),
          },
        );
        // Also request coarse location for better compatibility
        const coarseLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          {
            title: t('common.geolocation_permission_title'),
            message: t('common.geolocation_permission_approx_message'),
            buttonNeutral: t('common.ask_me_later'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('common.ok'),
          },
        );
        // Grant if either permission is granted
        granted =
          fineLocation === PermissionsAndroid.RESULTS.GRANTED ||
          coarseLocation === PermissionsAndroid.RESULTS.GRANTED
            ? 'granted'
            : fineLocation;
      }

      if (granted === 'granted') {
        return true;
      } else {
        showToast({
          type: 0,
          message: t('common.location_permission_denied'),
        });
        return false;
      }
    } catch (err) {
      showToast({
        type: 0,
        message: t('common.location_permission_error'),
      });

      return false;
    }
  }, []);

  const getLocation = useCallback(async () => {
    try {
      setLoadingLocation(true);

      // Load stored location first and use it immediately while fetching new location
      let saved = await loadStoredLocation();
      if (saved) {
        setLocation(saved);
        setMyPosition(saved);
        // Don't set loadingLocation to false yet - we're still fetching current location
      }

      const hasPermission = await requestLocationPermission();

      if (hasPermission) {
        // For iOS: Add additional delay after permission to ensure location services are ready
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        Geolocation.getCurrentPosition(
          locationPosition => {
            const {latitude, longitude, accuracy} = locationPosition.coords;

            // The Fused provider can return a coarse last-known fix far from the
            // real position. If it's weak and we already have a stored location,
            // keep the stored one instead of snapping the pin away.
            if (
              (typeof accuracy !== 'number' || accuracy > MAX_ACCURACY_M) &&
              saved
            ) {
              setLoadingLocation(false);
              return;
            }

            let region = {
              latitude,
              longitude,
              latitudeDelta: 0.0043,
              longitudeDelta: 0.0034,
            };

            // Save the successfully obtained location
            saveLocation(region);
            setLocation(region);
            setMyPosition(region);
            setLoadingLocation(false);
          },
          async error => {
            console.warn('Geolocation error:', error);

            // Reload stored location in case it changed
            const currentSaved = await loadStoredLocation();
            const fallbackLocation = currentSaved || saved;

            // Check if error is due to location services being disabled (Android)
            // Error code 1 = PERMISSION_DENIED, but could also mean location services are off
            const isLocationServicesDisabled =
              Platform.OS === 'android' &&
              (error.code === 1 || error.code === 2);

            if (isLocationServicesDisabled) {
              showToast({
                type: 0,
                message: t('common.location_services_disabled'),
              });
            } else if (currentSaved || saved) {
              // Silently use stored location if we have one
              console.log('Using stored location as fallback');
            } else {
              showToast({
                type: 0,
                message: t('common.unable_to_get_location'),
              });
            }

            setLocation(fallbackLocation);
            setMyPosition(fallbackLocation);
            setLoadingLocation(false);
          },
          {
            enableHighAccuracy: Platform.OS === 'android', // Use high accuracy on Android for better results
            timeout: Platform.OS === 'android' ? 20000 : 15000, // Longer timeout for Android
            maximumAge: 10000,
          },
        );
      } else {
        // Permission denied - use stored location if available, otherwise default
        const fallbackLocation = saved;
        setLocation(fallbackLocation);
        setMyPosition(fallbackLocation);
        setLoadingLocation(false);
        if (!saved) {
          showToast({type: 0, message: t('common.unable_to_get_location')});
        }
      }
    } catch (error) {
      console.log('getLocation error:', error);
      // On error, use stored location if available, otherwise default
      const saved = await loadStoredLocation();
      const fallbackLocation = saved;
      setLocation(fallbackLocation);
      setMyPosition(fallbackLocation);
      setLoadingLocation(false);
    }
  }, [requestLocationPermission, loadStoredLocation, saveLocation]);

  // Load stored location on mount
  useEffect(() => {
    const loadInitialLocation = async () => {
      const saved = await loadStoredLocation();
      if (saved) {
        // Use stored location immediately while fetching current location
        setLocation(saved);
        setMyPosition(saved);
        setLoadingLocation(false); // Show map with stored location
      }
      // Then try to get current location
      getLocation();
    };
    loadInitialLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Load stored location first, then try to get current location
      const loadAndFetch = async () => {
        const saved = await loadStoredLocation();
        if (saved) {
          // Use stored location immediately while fetching current location
          setLocation(saved);
          setMyPosition(saved);
          setLoadingLocation(false); // Show map with stored location
        } else {
          // No stored location - show loading
          setLocation(null);
          setMyPosition(null);
          setLoadingLocation(true);
        }
        setMapKey(prev => prev + 1);
        // Then try to get current location (will update if successful)
        getLocation();
      };
      loadAndFetch();
    }, [getLocation, loadStoredLocation]),
  );

  useEffect(() => {
    if (form.values.location_name && location?.latitude && !clean) {
      bottomSheetRef?.current?.snapToIndex(1);
    }
  }, [location, form, clean]);

  const handleSheetChanges = useCallback(index => {}, []);

  const handleAddressChanged = ({formatted_address, lng, lat, state}) => {
    saveRecentAddress({formatted_address, lat, lng, state});
    console.log('address changed==>>>>>.', {
      formatted_address,
      lng,
      lat,
      state,
    });
    form.setFieldValue('location_name', formatted_address);

    // Find state and set state_id only if found
    const foundState = authenticatedData.states?.find(o => o.name === state);
    if (foundState) {
      form.setFieldValue('state_id', foundState.id);
    }

    setLocation({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0,
      longitudeDelta: 0,
    });
    setMyPosition({
      latitude: lat,
      longitude: lng,
    });
  };
  const [showModal, setShowModal] = useState(false);
  const reducedMotion = useReducedMotion();
  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        pressBehavior={'none'}
        animatedIndex={{
          value: 0,
        }}
      />
    ),
    [],
  );

  return (
    <SafeAreaView
      onPress={() => Keyboard.dismiss()}
      style={[styles.safeAreaView, {width, height}]}>
      <GestureHandlerRootView style={styles.gestureHandlerRootView}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
          }}
          style={styles.mapPressable}>
          {location ? (
            <MapView
              key={mapKey}
              zoomControlEnabled={true}
              zoomEnabled={true}
              style={styles.mapStyle}
              initialRegion={location}
              region={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: location.latitudeDelta || 0.0043,
                longitudeDelta: location.longitudeDelta || 0.0034,
              }}
              customMapStyle={mapStyle}>
              {myPosition?.latitude && myPosition?.longitude && (
                <Marker
                  draggable
                  coordinate={{
                    latitude: myPosition.latitude,
                    longitude: myPosition.longitude,
                  }}
                  onDragEnd={e => {
                    const {coordinate} = e.nativeEvent;
                    setLocation({
                      latitude: coordinate.latitude,
                      longitude: coordinate.longitude,
                      latitudeDelta: 0.0043,
                      longitudeDelta: 0.0034,
                    });
                    setMyPosition({
                      latitude: coordinate.latitude,
                      longitude: coordinate.longitude,
                    });
                  }}
                  title={t('home.map_marker_title')}
                  // description={t('home.marker_description')}
                />
              )}
            </MapView>
          ) : (
            <View
              style={[
                styles.mapStyle,
                {
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f3f5f7',
                },
              ]}>
              <Text fontType={'roboto'} style={{fontSize: 16, color: '#666'}}>
                {loadingLocation
                  ? t('common.getting_location')
                  : t('common.loading_map')}
              </Text>
            </View>
          )}
        </Pressable>
        <TouchableOpacity
          onPress={() => navigation.navigate('profile')}
          style={styles.profileButton}>
          <Image style={styles.avatarImage} source={{uri: user?.avatar}} />
        </TouchableOpacity>

        <BottomSheet
          enableDynamicSizing={false}
          ref={bottomSheetRef}
          index={0}
          backdropComponent={renderBackdrop}
          animateOnMount={!reducedMotion}
          keyboardBehavior="interactive"
          style={styles.bottomSheet}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}>
          {form.values.location_name && location?.latitude ? (
            <BottomSheetScrollView contentContainerStyle={styles.mainContainer}>
              <Pressable onPress={() => Keyboard.dismiss()}>
                <Text
                  style={styles.titleText}
                  semibold
                  center
                  fontType={'roboto'}>
                  {step === 2
                    ? form.values?.clean_type?.name
                    : t('home.use_cleaning_service')}
                </Text>
              </Pressable>
              {step === 1 ? (
                <Pressable
                  onPress={() => Keyboard.dismiss()}
                  style={styles.step1Container}>
                  {/* <TouchableOpacity
                    onPress={() => {
                      // bottomSheetRef.current.snapToPosition(1);
                      bottomSheetRef.current.snapToIndex(1);
                      // bottomSheetRef.current
                      // bottomSheetRef.current.close();
                    }}> */}
                  <TextInputField
                    custom
                    // disabled
                    placeholder={t('home.location_placeholder')}
                    style={styles.inputBorder}
                    {...formHandler('location_name', form)}
                    label={t('home.location_label')}
                    mainStyles={{width: '100%'}}
                  />
                  {/* </TouchableOpacity> */}

                  {form.values['state_id'] && (
                    <DetailsText1>
                      {
                        authenticatedData.states.find(
                          o => o.id == form.values['state_id'],
                        ).name
                      }{' '}
                      (
                      {
                        authenticatedData.states.find(
                          o => o.id == form.values['state_id'],
                        ).tax
                      }
                      % tax)
                    </DetailsText1>
                  )}

                  <View style={doubleSelectStyle}>
                    <Select
                      custom
                      style={styles.inputBorder}
                      {...formHandler('clean_type', form)}
                      onValueChange={(text, id) => {
                        let data;
                        if (id === 1) {
                          data = {
                            clean_type: {name: text, id},
                            bedrooms: Math.max(form.values?.bedrooms ?? 0, 1),
                            bedrooms_min: 1,
                            washrooms: Math.max(form.values?.washrooms ?? 0, 1),
                            washrooms_min: 1,
                            stove: 0,
                            stove_min: 0,
                            microwave: 0,
                            microwave_min: 0,

                            dish_washer: 0,
                            dish_washer_min: 0,
                          };
                        } else if (id === 2) {
                          data = {
                            clean_type: {name: text, id},
                            bedrooms: Math.max(form.values?.bedrooms ?? 0, 1),
                            bedrooms_min: 1,
                            washrooms: Math.max(form.values?.washrooms ?? 0, 1),
                            washrooms_min: 1,
                            stove: 1,
                            stove_min: 1,
                            microwave: 1,
                            microwave_min: 1,

                            dish_washer: 1,
                            dish_washer_min: 1,
                          };
                        } else if (id === 3) {
                          data = {
                            clean_type: {name: text, id},
                            bedrooms: Math.max(form.values?.bedrooms ?? 0, 1),
                            bedrooms_min: 1,
                            washrooms: Math.max(form.values?.washrooms ?? 0, 1),
                            washrooms_min: 1,
                            stove: 1,
                            stove_min: 1,
                            microwave: 1,
                            microwave_min: 1,

                            dish_washer: 0,
                            dish_washer_min: 0,
                          };
                        }
                        form.setValues({
                          ...form.values,
                          ...data,
                        });
                      }}
                      styles={{width: '100%'}}
                      label={t('home.cleaning_type_label')}
                      list={authenticatedData?.clean_types}
                    />

                    {/* <NumberSelect
                      containerStyle={{marginTop: 14}}
                      least={1}
                      form={form}
                      item={{name: 'Number of Cleaners', id: 'cleaners'}}
                    /> */}
                  </View>

                  <View
                    style={[doubleSelectStyle, styles.doubleSelectWithMargin]}>
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.bedrooms'),
                        id: 'bedrooms',
                      }}
                    />
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.washrooms'),
                        id: 'washrooms',
                      }}
                    />
                  </View>
                  <View
                    style={[doubleSelectStyle, styles.doubleSelectWithMargin]}>
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.kitchens'),
                        id: 'kitchens',
                      }}
                    />
                    <NumberSelect
                      moreInfo
                      onClickMoreInfo={() => setShowModal(true)}
                      form={form}
                      item={{
                        name: t('home.other_rooms'),
                        id: 'otherrooms',
                      }}
                    />
                  </View>
                  <View
                    style={[doubleSelectStyle, styles.doubleSelectWithMargin]}>
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.living_family_rooms'),
                        id: 'livingrooms',
                      }}
                    />
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.dinning_rooms'),
                        id: 'dinningrooms',
                      }}
                    />
                  </View>
                  <View
                    style={[doubleSelectStyle, styles.doubleSelectWithMargin]}>
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.laundry_rooms'),
                        id: 'laundryrooms',
                      }}
                    />
                    <NumberSelect
                      form={form}
                      item={{
                        name: t('home.office_den_rooms'),
                        id: 'officerooms',
                      }}
                    />
                  </View>

                  {form.values?.clean_type && (
                    <Details style={styles.detailsMargin}>
                      <View style={styles.detailsContent}>
                         <DetailsText1>
                          {form.values?.clean_type?.name}
                        </DetailsText1> 
                        <DetailsText2>
                          {authenticatedData?.clean_types
                            ?.find(i => i.id === form.values?.clean_type?.id)
                            ?.description?.replace(
                              /(<\/p> <p>)|(<br\/>)|(<br \/>)/g,
                              '\n\n',
                            )
                            ?.replace(/(<([^>]+)>)/g, '')}
                        </DetailsText2>
                      </View>
                    </Details>
                  )}

                  <View
                    style={[flexBetween, styles.iconButtonsRowWithoutPadding]}>
                    <BottomSheetButton
                      style={styles.backButton}
                      text={t('common.cancel')}
                      onPress={handleGoBack}
                    />
                    <BottomSheetButton
                      style={styles.nextButton}
                      text={t('common.continue')}
                      onPress={handleNext}
                      disabled={
                        !form.values.location_name || !form.values.clean_type
                      }
                    />
                  </View>
                </Pressable>
              ) : step === 2 ? (
                <>
                  <View style={styles.step2Container}>
                    <Text medium center style={styles.extrasTitle}>
                      {t('home.extras_optional')}
                    </Text>
                    <View
                      style={[
                        doubleSelectStyle,
                        styles.doubleSelectWithMargin,
                      ]}>
                      <NumberSelect
                        form={form}
                        item={{
                          name: t('home.refrigerators'),
                          id: 'refridgerator',
                        }}
                      />
                      <NumberSelect
                        form={form}
                        item={{
                          name: t('home.stoves'),
                          id: 'stove',
                        }}
                      />
                    </View>
                    <View
                      style={[
                        doubleSelectStyle,
                        styles.doubleSelectWithMargin,
                      ]}>
                      <NumberSelect
                        form={form}
                        item={{
                          name: t('home.dish_washer'),
                          id: 'dish_washer',
                        }}
                      />
                      <NumberSelect
                        form={form}
                        item={{
                          name: t('home.microwave'),
                          id: 'microwave',
                        }}
                      />
                    </View>
                  </View>
                  <View style={styles.notesContainer}>
                    <TextInputField
                      custom
                      style={styles.inputBorder}
                      {...formHandler('notes', form)}
                      placeholder={t('home.notes_placeholder')}
                      label={t('home.notes_optional')}
                      mainStyles={{width: '100%'}}
                    />
                  </View>
                  <View style={[flexBetween, styles.iconButtonsRowWithPadding]}>
                    <BottomSheetButton
                      style={styles.backButton}
                      text={t('common.back')}
                      onPress={handleGoBack}
                    />
                    <BottomSheetButton
                      style={styles.nextButton}
                      text={t('common.continue')}
                      onPress={handleNext}
                    />
                  </View>
                </>
              ) : step === 3 ? (
                <View style={styles.step3Container}>
                  <View
                    style={[
                      doubleSelectStyle,
                      styles.doubleSelectWithPadding,
                    ]}>
                    <Select
                      custom
                      style={styles.selectInput}
                      {...formHandler('occurrence', form)}
                      onValueChange={(text, id) => {
                        form.setValues({
                          ...form.values,
                          occurrence: {name: text, id},
                          type: id,
                          frequency: '',
                          schedule_date: formatDateOnly(new Date()),
                          schedule_time: null,
                        });
                      }}
                      styles={{
                        width:
                          form.values?.occurrence?.id === 1 ? '47%' : '100%',
                      }}
                      label={t('home.frequency_label')}
                      list={ScheduleOccurrenceData}
                    />
                    {form.values?.occurrence?.id === 1 && (
                      <Select
                        custom
                        style={styles.selectInput}
                        {...formHandler('frequency', form)}
                        onValueChange={(text, id) => {
                          form.setFieldValue('frequency', {name: text, id});
                        }}
                        styles={{width: '47%'}}
                        label={t('home.frequency_of_occurrence')}
                        list={authenticatedData?.options.frequencies}
                      />
                    )}
                  </View>
                  {/* {form.values.type === 1 && (
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        paddingHorizontal: 18,
                      }}>
                      <Select
                        custom
                        style={{borderColor: '#000', height: 50}}
                        {...formHandler('frequency', form)}
                        onValueChange={(text, id) => {
                          form.setFieldValue('frequency', {name: text, id});
                        }}
                        styles={{width: '100%'}}
                        label={t('booking.frequency_of_occurrence')}
                        list={authenticatedData?.options.frequencies}
                      />
                    </View>
                  )} */}
                  {(form.values.type === 1 || form.values.type === 2) && (
                    <View
                      style={[
                        doubleSelectStyle,
                        styles.doubleSelectWithPadding,
                      ]}>
                      <Datepicker
                        custom
                        label={t('home.schedule_date_time')}
                        {...formHandler('schedule_date', form)}
                        mode={'date'}
                        placeholder={t('home.placeholder_date')}
                      />
                      <Datepicker
                        custom
                        label={t('home.schedule_date_time')}
                        {...formHandler('schedule_time', form)}
                        mode={'time'}
                        placeholder={t('home.placeholder_time')}
                      />
                    </View>
                  )}

                  <View style={[flexBetween, styles.iconButtonsRowWithPadding]}>
                    <BottomSheetButton
                      style={styles.backButton}
                      text={t('common.back')}
                      onPress={handleGoBack}
                    />
                    <BottomSheetButton
                      style={styles.nextButton}
                      text={t('common.submit')}
                      onPress={form.handleSubmit}
                    />
                  </View>
                </View>
              ) : null}
            </BottomSheetScrollView>
          ) : (
            <GooglePlacesInput
              bottomSheetRef={bottomSheetRef}
              handleAddressChanged={handleAddressChanged}
              recentAddresses={recentAddresses}
              custom
              style={styles.inputBorder}
              placeholder={t('home.search_location_placeholder')}
              label={t('home.location_label')}
              mainStyles={{width: '100%'}}
            />
          )}
        </BottomSheet>
        {showModal && (
          <View style={styles.modalOverlay}>
            <Modal1 style={styles.modalContent} setShowModal={setShowModal}>
              <View style={styles.modalInner}>
                <Text style={styles.modalText} fontType={'roboto'} center>
                  {t('home.other_rooms_info')}
                </Text>
              </View>
            </Modal1>
          </View>
        )}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default HomeInner;

const styles = StyleSheet.create({
  p: {
    marginVertical: 0,
    paddingVertical: 0,
    color: 'red',
  },
  br: {
    marginVertical: 50,
    paddingVertical: 50,
    marginBottom: 50,
    lineHeight: '500px',
  },
  container: {
    flex: 1,
    position: 'relative',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  mainContainer: {
    paddingTop: 20,
    paddingBottom: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  selectList: {
    gap: 20,
    alignItems: 'center',
    display: 'flex',
    paddingHorizontal: 18,
  },
  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // bottom: -25,
    bottom: 0,
  },
  safeAreaView: {
    flex: 1,
  },
  gestureHandlerRootView: {
    flex: 1,
    zIndex: 10,
  },
  mapPressable: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
  },
  profileButton: {
    position: 'absolute',
    zIndex: 0,
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: 32,
    marginLeft: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  bottomSheet: {
    backgroundColor: 'transparent',
  },
  titleText: {
    fontSize: 18,
  },
  step1Container: {
    paddingHorizontal: 18,
    marginTop: 12,
  },
  inputBorder: {
    borderColor: '#000',
  },
  doubleSelectWithMargin: {
    marginTop: 12,
  },
  detailsMargin: {
    marginTop: 12,
  },
  detailsContent: {
    width: '100%',
    justifyContent: 'center',
    gap: 4,
  },
  iconButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  iconButtonsRowRight: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
  },
  nextButton: {
    padding: 8,
    marginVertical: 12,
    height: 40,
    minWidth: 100,
    display: 'flex',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    alignItems: 'center',
    selfAlign: 'flex-end',
    selfJustify: 'flex-end',
    setToEnd: true,
  },
  backButton: {
    padding: 8,
    marginVertical: 12,
    height: 40,
    minWidth: 100,
    display: 'flex',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  step2Container: {
    paddingHorizontal: 18,
  },
  extrasTitle: {
    fontSize: 14,
    marginTop: 16,
  },
  notesContainer: {
    paddingHorizontal: 18,
  },
  iconButtonsRowWithPadding: {
    flexDirection: 'row',
    paddingHorizontal: 18,
  },
  iconButtonsRowWithoutPadding: {
    flexDirection: 'row',
  },
  doubleSelectWithPadding: {
    paddingHorizontal: 18,
  },
  selectInput: {
    borderColor: '#000',
    height: 50,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalContent: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    paddingVertical: 10,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  modalInner: {
    alignItems: 'center',
    gap: 20,
    width: '90%',
  },
  modalText: {
    fontSize: 14,
    color: '#252525',
  },
  step3Container: {
    flex: 1,
  },
});
