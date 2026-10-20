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
  Alert,
} from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import Text from '../../components/Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import MapView, {Marker} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {colors} from '../../config/colors';
import Button from '../../components/Shared/Button';
import SearchingForCleanerInfo from '../../components/Home/SearchingForCleanerInfo';
import timeformatter, {calcTimeEst} from '../../utils/timeformatter';
import {cancelClean} from '../../store/actions/dashboard/cancelClean';
import {endClean} from '../../store/actions/dashboard/endClean';
import {
  hideContactMeModalAction,
  resetSearchTimer,
  showContactMeModalAction,
  removeClean,
} from '../../store/reducer/userSlice';
import {contactMe} from '../../store/actions/dashboard/contactMe';
import {getClean} from '../../store/actions/dashboard/getClean';
import Modal1 from '../../components/Modals/Modal1';
import FuntionButton from '../../components/Buttons/FuntionButton';
import {clean as cleanAction} from '../../store/actions/dashboard/clean';
import {retryClean} from '../../store/actions/dashboard/retryClean';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import ImageView from 'react-native-image-viewing';
import {useTranslation} from 'react-i18next';
import {getActiveCleaner, WORKER_STATUSES} from '../../utils/activeCleaner';
import {
  formatDistance,
  metersBetween,
  selectCleanerOrigin,
  originDriftThresholdM,
} from '../../utils/distanceDisplay';

const {width, height} = Dimensions.get('window');

const CleanDetails = ({route}) => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  // const data = route?.params?.data || useSelector(state => state.user.clean);
  const {cleanersLocation} = useSelector(state => state.user);

  const clean = useSelector(state => state.user.clean);

  // The customer's cleaner is only ever the ACTIVE worker; a cancelled straggler (status 5)
  // must be ignored so the map + bottom sheet revert to searching. See utils/activeCleaner.
  const activeCleaner = getActiveCleaner(clean);

  const formattedCleanData =
    clean?.clean_amend?.status === 1
      ? clean?.clean_amend
      : clean?.clean_amend_oldest?.status === 1
      ? clean?.clean_amend_oldest
      : clean;

  const getDisplayedTaxInclusiveAmount = cleanData => {
    const isDiscounted = Boolean(cleanData?.is_discounted);
    const amount = Number(cleanData?.amount);
    const amountDiscounted = Number(cleanData?.amount_discounted);
    const amountOriginal = Number(cleanData?.amount_original);

    if (isDiscounted) {
      if (Number.isFinite(amountDiscounted)) return amountDiscounted;
      if (Number.isFinite(amount)) return amount;
      if (Number.isFinite(amountOriginal)) return amountOriginal;
      return 0;
    }

    if (Number.isFinite(amount)) return amount;
    if (Number.isFinite(amountOriginal)) return amountOriginal;
    return 0;
  };

  // const data =
  //   clean?.clean_amend?.status === 1
  //     ? {...clean?.clean_amend, status: clean?.status}
  //     : clean;
  const data =
    clean?.clean_amend?.status === 1 ? clean /* ?.clean_amend */ : clean;

  console.log('data====>', data);

  const GOOGLE_MAPS_APIKEY = 'AIzaSyDn0UxJc8Jvk-e_mAabhB1F_AQynS9y3g0';

  const dispatch = useDispatch();

  const [viewerVisible, setViewerVisible] = useState(false);

  // Track if component has mounted - prevents modal flash from stale Redux state
  const [hasMounted, setHasMounted] = useState(false);

  // Reset modal state on mount
  useEffect(() => {
    dispatch(hideContactMeModalAction());
    // Allow modal to show only after reset is dispatched
    setHasMounted(true);
  }, []);

  const {user, shouldShowContactMeModal} = useSelector(state => state.user);

  const mapStyle = [];

  const [timeDis, setTimeDis] = useState({
    min: '00',
    sec: '00',
  });
  const [distanceKm, setDistanceInKm] = useState(null);
  // Set when Directions can't produce a route at all. The ETA and the distance both come
  // from that one result, so if it fails there is nothing honest to put in the row.
  const [routeFailed, setRouteFailed] = useState(false);
  const serverTimeOffset = useSelector(state => state.user.serverTimeOffset);

  // Which coordinate to route FROM, and whether it can still be trusted. The ownership
  // guard here is the one the cleaner marker below already applies but the distance and
  // route did not — so they could measure from a different cleaner entirely.
  const cleanerOrigin = useMemo(
    () =>
      selectCleanerOrigin({
        cleanersLocation,
        activeCleaner,
        nowMs: Date.now(),
        serverOffsetMs: serverTimeOffset || 0,
      }),
    [cleanersLocation, activeCleaner, serverTimeOffset],
  );

  // Throttle the Directions origin the way the cleaner app does, so a cleaner sitting at a
  // light doesn't re-request the same route every heartbeat. The threshold tightens on
  // final approach so the number doesn't freeze over the last stretch.
  const [directionsOrigin, setDirectionsOrigin] = useState(null);
  const lastOriginRef = useRef(null);
  // Depend on the coordinates, not the object — cleanerOrigin is rebuilt on every
  // broadcast, so an object dependency would defeat the throttle it is feeding.
  const originLat = cleanerOrigin?.lat;
  const originLng = cleanerOrigin?.lng;
  useEffect(() => {
    if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) return;
    const next = {latitude: originLat, longitude: originLng};
    const prev = lastOriginRef.current;
    if (
      !prev ||
      metersBetween(
        prev.latitude,
        prev.longitude,
        next.latitude,
        next.longitude,
      ) >= originDriftThresholdM(distanceKm)
    ) {
      lastOriginRef.current = next;
      setDirectionsOrigin(next);
    }
  }, [originLat, originLng, distanceKm]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isShowingSuccessModalRef = useRef(false);

  const mapRef = useRef(null);

  const bottomSheetRef2 = useRef();

  // variables
  const snapPoints = useMemo(() => ['25%', '75%', '100%'], []);

  // callbacks
  const handleSheetChanges = useCallback(index => {}, []);

  const handleCancel = () => {
    const payload = {
      id: data?.id,
      status: 5,
      review_rating: 0,
    };
    dispatch(cancelClean({payload, navigation}));
  };

  const handleCancelInit = () => {
    Alert.alert(t('cleanDetails.cancel_clean_confirm'), null, [
      {
        text: 'No',
        style: 'default',
      },
      {
        text: 'Yes',
        onPress: () => handleCancel(),
        style: 'destructive',
      },
    ]);
  };

  const handleCompletedInit = () => {
    Alert.alert(t('cleanDetails.end_clean_confirm'), null, [
      {
        text: 'No',
        style: 'default',
      },
      {
        text: 'Yes',
        onPress: () => handleCompleted(),
        style: 'destructive',
      },
    ]);
  };

  const handleCompleted = () => {
    const payload = {
      id: data?.id,
      status: 7,
      review_rating: 0,
      review_comment: '',
      comments: '',
    };
    dispatch(endClean({payload, navigation}));
  };

  const handleGoToChat = () => {
    navigation.navigate('chatroom');
  };

  const handleContactMe = () => {
    isShowingSuccessModalRef.current = true;
    dispatch(
      contactMe({
        payload: {
          task_type_id: 5,
          reason: 'failed_matching',
          clean_id: clean?.id,
        },
        callBack: () => {
          dispatch(hideContactMeModalAction());
          setShowSuccessModal(true);
        },
      }),
    );
  };

  const handleSuccessModalOK = () => {
    setShowSuccessModal(false);
    navigation.navigate('dashboard', {screen: 'Home'});
  };

  const handleCancelModal = () => {
    dispatch(removeClean());
    dispatch(hideContactMeModalAction());
    navigation.navigate('dashboard', {screen: 'Home'});
  };

  const handleCloseModal = () => {
    dispatch(hideContactMeModalAction());
  };

  const handleTryAgain = () => {
    dispatch(
      retryClean({
        cleanId: clean?.id,
        navigation,
        callBack: () => {
          dispatch(hideContactMeModalAction());
          dispatch(getClean());
        },
      }),
    );
  };

  useEffect(() => {
    if (!data && !isShowingSuccessModalRef.current) {
      navigation.navigate('dashboard', {screen: 'Home'});
    }
  }, [data, navigation]);

  return (
    <SafeAreaView
      onPress={() => Keyboard.dismiss()}
      style={{flex: 1, width, height}}>
      <GestureHandlerRootView style={{flex: 1, zIndex: 10}}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          style={{
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}>
          {Number.isFinite(data?.position?.lat) &&
            Number.isFinite(data?.position?.lng) && (
              <MapView
                ref={mapRef}
                key={`map-${data.id}-${clean?.clean_cleaners_status}`}
                zoomControlEnabled={true}
                zoomEnabled={true}
                style={styles.mapStyle}
                pitchEnabled={false}
                toolbarEnabled={false}
                rotateEnabled={false}
                scrollEnabled={true}
                mapType={'standard'}
                initialRegion={{
                  latitude: data.position.lat,
                  longitude: data.position.lng,
                  latitudeDelta: 0.0043,
                  longitudeDelta: 0.0034,
                }}
                customMapStyle={mapStyle}>
                <Marker
                  key="clean-location"
                  coordinate={{
                    latitude: data.position.lat,
                    longitude: data.position.lng,
                  }}
                  title={t('home.amend_location_marker')}
                  description={t('home.marker_description')}
                />

                {/* Only ACTIVE workers get a marker; a cancelled straggler (status 5) is dropped
                    so it doesn't linger on the map. Also pre-filter nil coordinates. */}
                {clean?.clean_cleaners
                  ?.filter(c => WORKER_STATUSES.includes(c?.status))
                  .map(({position, id, user_id, ...others}) => {
                    // Determine the coordinates to use
                    const lat =
                      user_id === cleanersLocation?.id
                        ? cleanersLocation?.current_position?.lat
                        : position?.lat;
                    const lng =
                      user_id === cleanersLocation?.id
                        ? cleanersLocation?.current_position?.lng
                        : position?.lng;

                    // Return marker data only if coordinates are valid numbers
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      return {
                        user_id,
                        lat,
                        lng,
                        first_name: others?.user?.first_name,
                      };
                    }
                    return null;
                  })
                  .filter(Boolean) // Remove all null entries BEFORE rendering
                  .map(marker => (
                    <Marker
                      key={`cleaner-${marker.user_id}`}
                      coordinate={{
                        latitude: marker.lat,
                        longitude: marker.lng,
                      }}
                      title={`${marker.first_name || 'Cleaner'}'s location`}
                    />
                  ))}

                {/* Only render directions if ALL coordinates are valid numbers */}
                {(() => {
                  const destLat = data?.position?.lat;
                  const destLng = data?.position?.lng;

                  const hasValidOrigin = directionsOrigin != null;
                  const hasValidDest =
                    Number.isFinite(destLat) && Number.isFinite(destLng);

                  if (
                    activeCleaner &&
                    clean?.clean_cleaners_status !== 4 &&
                    clean?.clean_cleaners_status !== 3 &&
                    hasValidOrigin &&
                    hasValidDest
                  ) {
                    return (
                      <MapViewDirections
                        key="directions"
                        strokeColor={colors.brandPrimary}
                        strokeWidth={10}
                        timePrecision={'now'}
                        optimizeWaypoints={true}
                        onReady={result => {
                          // ONE source for both halves of the row: result.distance is
                          // already km and result.duration already minutes, so the pair is
                          // always internally consistent and matches the cleaner app.
                          // Do NOT reintroduce a straight-line writer here — two writers
                          // racing into distanceKm is what caused BUG-1001. (The row is
                          // gated below status 3 and unmounts on arrival, so a road
                          // distance never needs to count down to zero.)
                          setRouteFailed(false);
                          setDistanceInKm(result?.distance);
                          setTimeDis({
                            min: parseInt(result?.duration, 10)?.toFixed(),
                            sec: parseInt(
                              (result?.duration * 60) % 60,
                              10,
                            )?.toFixed(),
                          });

                          // Auto-zoom to fit the route logic
                          mapRef.current?.fitToCoordinates(result.coordinates, {
                            edgePadding: {
                              right: width / 10,
                              bottom: height / 10,
                              left: width / 10,
                              top: height / 10,
                            },
                          });
                        }}
                        onError={errorMessage => {
                          console.log('Directions error:', errorMessage);
                          setRouteFailed(true);
                        }}
                        precision={'high'}
                        origin={directionsOrigin}
                        destination={{
                          latitude: destLat,
                          longitude: destLng,
                        }}
                        apikey={GOOGLE_MAPS_APIKEY}
                      />
                    );
                  }
                  return null;
                })()}
              </MapView>
            )}
        </Pressable>
        <TouchableOpacity
          onPress={() => navigation.navigate('profile')}
          style={{
            position: 'absolute',
            zIndex: 0,
            top: 5,
            left: 0,
            width: 50,
            height: 50,
            borderRadius: 25,
            marginTop: 32,
            marginLeft: 20,

            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Image
            style={{height: 50, width: 50, borderRadius: 25}}
            source={{uri: user?.avatar}}
          />
        </TouchableOpacity>

        <BottomSheet
          enableDynamicSizing={false}
          ref={bottomSheetRef2}
          index={1}
          style={{backgroundColor: 'transparent'}}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}>
          <BottomSheetScrollView contentContainerStyle={styles.mainContainer}>
            {activeCleaner &&
              clean?.clean_cleaners_status >= 1 &&
              clean?.clean_cleaners_status < 3 &&
              !routeFailed && (
                <View style={{marginBottom: 8}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                    {distanceKm == null ? (
                      <Text
                        fontType={'roboto'}
                        bold
                        style={{fontSize: 20, color: colors.brandPrimary}}>
                        {t('cleanDetails.distance_calculating')}
                      </Text>
                    ) : (
                      <>
                        <Text
                          fontType={'roboto'}
                          bold
                          style={{fontSize: 20, color: colors.brandPrimary}}>
                          {(() => {
                            const min = parseInt(timeDis?.min || 0, 10);
                            const sec = parseInt(timeDis?.sec || 0, 10);
                            const hours = Math.floor(min / 60);
                            const remainingMin = min % 60;

                            if (hours > 0) {
                              return `${hours} hr${
                                hours > 1 ? 's' : ''
                              } ${remainingMin} min`;
                            } else if (min >= 1) {
                              return `${min} min${sec > 0 ? ` ${sec} sec` : ''}`;
                            } else {
                              return `${sec} sec`;
                            }
                          })()}
                        </Text>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: colors.brandPrimary,
                          }}
                        />
                        <Text
                          fontType={'roboto'}
                          bold
                          style={{fontSize: 20, color: colors.brandPrimary}}>
                          {formatDistance(distanceKm)}
                        </Text>
                      </>
                    )}
                  </View>
                  {cleanerOrigin?.isStale && distanceKm != null && (
                    <Text
                      fontType={'roboto'}
                      center
                      style={{fontSize: 12, color: '#8A8A8E', marginTop: 2}}>
                      {t('cleanDetails.position_updating')}
                    </Text>
                  )}
                </View>
              )}

            <SearchingForCleanerInfo />

            {clean?.clean_cleaners_status >= 1 && activeCleaner?.user && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                  }}>
                  <TouchableOpacity onPress={() => setViewerVisible(true)}>
                    <Image
                      style={{height: 50, width: 50, borderRadius: 25}}
                      source={{uri: activeCleaner.user.avatar}}
                    />
                  </TouchableOpacity>
                  <View style={{gap: 2}}>
                    <Text
                      color={'#525354'}
                      fontType={'roboto'}
                      style={{fontSize: 12}}>{t('cleanDetails.your_cleaner')}</Text>
                    <Text
                      color={'#0B071B'}
                      fontType={'roboto'}
                      semibold
                      capitalized
                      style={{fontSize: 16}}>
                      {activeCleaner.user.first_name}
                    </Text>
                    {activeCleaner.user.rating ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 2,
                            alignItems: 'center',
                          }}>
                          {[1, 2, 3, 4, 5].map(index => (
                            <FontAwesome
                              key={index}
                              style={{color: '#F8C22E'}}
                              name={
                                index <= activeCleaner.user.rating
                                  ? 'star'
                                  : 'star-o'
                              }
                              size={14}
                            />
                          ))}
                        </View>
                        <Text fontType={'roboto'} bold style={{fontSize: 14}}>
                          {activeCleaner.user.rating}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <ImageView
                    images={[{uri: activeCleaner.user.avatar}]}
                    imageIndex={0}
                    visible={viewerVisible}
                    onRequestClose={() => setViewerVisible(false)}
                  />
                </View>
              )}

            <Button
              disabled={
                !clean ||
                clean?.clean_cleaners_status == null ||
                clean?.clean_cleaners_status < 1
              }
              text={t('chat.title')}
              pressed={handleGoToChat}
              height={52}
              style={{
                width: '100%',
                borderRadius: 8,
                marginVertical: 16,
              }}
              customEndAdornment={true}
            />
            <View style={[styles.detailsItem, {borderTopWidth: 0, gap: 4}]}>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>{t('amendRequest.cleaning_location_address')}</Text>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>
                {data?.location}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {timeformatter(data?.created_at)}
              </Text>
            </View>

            <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.type_of_cleaning')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {data?.clean_type?.name}
                </Text>
              </View>
              {/* <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('cleanDetails.no_of_cleaners')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {data?.cleaners}
                </Text>
              </View> */}
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('history.price_tax_inclusive')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {data?.country?.currency || 'CAD $'}{' '}
                  {Number(getDisplayedTaxInclusiveAmount(clean)).toFixed(2)}
                </Text>
              </View>
              {/* <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('cleanDetails.estimated_time')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {calcTimeEst(formattedCleanData?.duration)}
                </Text>
              </View> */}
            </View>
            <View
              style={[
                styles.detailsItem,
                styles.detailsItemQuantity,
                {paddingBottom: 0},
              ]}>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.bedrooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.bedrooms}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.washrooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.washrooms}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.kitchens')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.kitchens}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.other_rooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.otherrooms}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.living_family_rooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.livingrooms}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.dinning_rooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.dinningrooms}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.laundry_rooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.laundryrooms}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.office_den_rooms')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.officerooms}
                </Text>
              </View>

              <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
                <View style={[{width: '100%'}]}>
                  <Text fontType={'roboto'} bold style={{fontSize: 14}}>
                    {t('extras.label')}
                  </Text>
                </View>
                <View style={styles.detailsItemInner}>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>{t('amendRequest.refrigerator')}</Text>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 16}}>
                    {formattedCleanData?.extras?.refridgerator}
                  </Text>
                </View>
                <View style={styles.detailsItemInner}>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>{t('amendRequest.stove')}</Text>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 16}}>
                    {formattedCleanData?.extras?.stove}
                  </Text>
                </View>
                <View style={styles.detailsItemInner}>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>{t('amendRequest.dish_washer')}</Text>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 16}}>
                    {formattedCleanData?.extras?.dish_washer}
                  </Text>
                </View>
                <View style={styles.detailsItemInner}>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>{t('amendRequest.microwave')}</Text>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 16}}>
                    {formattedCleanData?.extras?.microwave}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.detailsItem]}>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('history.receipt_notes')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {formattedCleanData?.notes}
                </Text>
              </View>
            </View>

            <View style={styles.btnContainer}>
              <Button
                text={t('cleanDetails.cancel_button')}
                pressed={handleCancelInit}
                height={52}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  backgroundColor: colors.orangeDark,
                  marginVertical: clean?.clean_cleaners_status === 4 ? 0 : 16,
                }}
              />
            </View>

            {clean?.clean_cleaners_status === 4 && (
              <Button
                text={t('cleanDetails.end_button')}
                pressed={handleCompletedInit}
                height={52}
                style={{
                  width: '100%',
                  backgroundColor: '#0CBC87',
                  borderRadius: 8,
                  marginVertical: 16,
                }}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
      {hasMounted && shouldShowContactMeModal && (
        <View
          style={{
            zIndex: 100,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}>
          <Modal1
            style={{
              position: 'relative',
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              height: 320,
              paddingVertical: 0,
            }}
            setShowModal={() => {}}>
            <View
              style={{
                justifyContent: 'space-evenly',
                alignItems: 'center',
                width: '90%',
                flex: 1,
                paddingTop: 0,
              }}>
              <Text
                center
                style={{fontSize: 18, color: '#252525'}}
                fontType={'roboto'}>{t('cleanDetails.no_cleaner_available_title')}</Text>
              <Text
                left
                style={{fontSize: 16, color: '#252525'}}
                fontType={'roboto'}>{t('cleanDetails.no_cleaner_available_body')}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}>
                <FuntionButton
                  style={{
                    alignSelf: 'center',
                    marginBottom: 0,
                    backgroundColor: colors.brandGreen,
                    width: '47%',
                  }}
                  onPress={handleTryAgain}
                  name={t('cleanDetails.try_again')}
                />
                <FuntionButton
                  style={{
                    alignSelf: 'center',
                    marginBottom: 0,
                    width: '47%',
                  }}
                  onPress={handleContactMe}
                  name={t('cleanDetails.contact_me')}
                />
                <FuntionButton
                  style={{width: '100%', backgroundColor: colors.orangeDark}}
                  onPress={handleCancelModal}
                  name={t('cleanDetails.cancel_button')}
                />
              </View>
            </View>
          </Modal1>
        </View>
      )}
      {showSuccessModal && (
        <View
          style={{
            zIndex: 100,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <Modal1
            style={{
              position: 'relative',
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              height: 280,
              paddingVertical: 0,
            }}
            setShowModal={() => {
              isShowingSuccessModalRef.current = false;
              setShowSuccessModal(false);
              navigation.navigate('dashboard', {screen: 'Home'});
            }}>
            <View
              style={{
                justifyContent: 'space-evenly',
                alignItems: 'center',
                width: '90%',
                flex: 1,
                paddingTop: 0,
              }}>
              <Text
                center
                style={{fontSize: 18, color: '#252525', marginBottom: 16}}
                fontType={'roboto'}>{t('cleanDetails.request_sent_message')}</Text>
              <Button
                text={t('common.ok')}
                pressed={handleSuccessModalOK}
                height={52}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  marginVertical: 16,
                }}
              />
            </View>
          </Modal1>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CleanDetails;

const styles = StyleSheet.create({
  mainContainer: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // bottom: -25,
    bottom: 80,
  },

  detailsItem: {
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,

    borderTopColor: colors.borderColor,
  },
  detailsItemInner: {
    gap: 4,
    flex: 1,
    minWidth: 130,
  },
  detailsItemQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  btnContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
});
