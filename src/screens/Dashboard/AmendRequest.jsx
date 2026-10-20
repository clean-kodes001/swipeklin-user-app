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
} from 'react-native';

import Text from '../../components/Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import MapView, {Marker} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {colors} from '../../config/colors';
import Button from '../../components/Shared/Button';
import SearchingForCleanerInfo from '../../components/Home/SearchingForCleanerInfo';
import timeformatter, {calcTime, calcTimeEst} from '../../utils/timeformatter';
import {cancelClean} from '../../store/actions/dashboard/cancelClean';
import {endClean} from '../../store/actions/dashboard/endClean';
import {declineAmend} from '../../store/actions/dashboard/declineAmend';
import {acceptAmend} from '../../store/actions/dashboard/acceptAmend';
import AmendCountDown from '../../components/Home/AmendCountDown';
import {getClean} from '../../store/actions/dashboard/getClean';
import {useTranslation} from 'react-i18next';

const {width, height} = Dimensions.get('window');

const AmendRequest = ({route}) => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  // const data = route?.params?.data || useSelector(state => state.user.clean);
  const data = useSelector(state => state.user?.clean?.clean_amend);
  // state => state.user?.clean?.clean_amend || state.user?.amendRequest,
  const clean = useSelector(state => state.user?.clean);

  const formattedCleanData =
    clean?.clean_amend?.status === 1
      ? clean?.clean_amend
      : clean?.clean_amend_oldest?.status === 1
      ? clean?.clean_amend_oldest
      : clean;

  const getDisplayedCurrentTaxInclusiveAmount = () => {
    const isDiscounted = Boolean(clean?.is_discounted);
    const discounted = Number(clean?.amount_discounted);
    const amount = Number(clean?.amount);
    const original = Number(clean?.amount_original);

    if (isDiscounted) {
      if (Number.isFinite(discounted)) return discounted;
      if (Number.isFinite(amount)) return amount;
      if (Number.isFinite(original)) return original;
      return 0;
    }

    if (Number.isFinite(amount)) return amount;
    if (Number.isFinite(original)) return original;
    return 0;
  };

  const getDisplayedAmendedTaxInclusiveAmount = () => {
    const amendedFromBackend = Number(clean?.amended_amount_charged);
    if (Number.isFinite(amendedFromBackend)) return amendedFromBackend;

    const amended = Number(clean?.clean_amend?.amount);
    if (Number.isFinite(amended)) return amended;

    return 0;
  };

  // const {authenticated: authenticatedData} = useSelector(state => state.data);
  const dispatch = useDispatch();

  const {user} = useSelector(state => state.user);

  const bottomSheetRef2 = useRef();

  // variables
  const snapPoints = useMemo(() => ['25%', '75%', '100%'], []);

  // callbacks
  const handleSheetChanges = useCallback(index => {}, []);

  const handleAccept = () => {
    const payload = {
      status: 1,
      notes: '',
    };
    dispatch(
      acceptAmend({
        payload,
        callBack: () => {},
      }),
    );
  };

  const handleDecline = () => {
    const payload = {
      status: 2,
      notes: '',
    };
    dispatch(
      declineAmend({
        payload,
        callBack: () => {},
      }),
    );
  };
  const handleContactSupport = () => {};

  return (
    <SafeAreaView
      onPress={() => Keyboard.dismiss()}
      style={{flex: 1, width, height}}>
      <GestureHandlerRootView style={{flex: 1, zIndex: 10}}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          style={{
            flex: 1,
            position: 'relative',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}>
          {data?.position?.lat && data?.position?.lng && (
            <MapView
              zoomControlEnabled={true}
              zoomEnabled={true}
              style={styles.mapStyle}
              region={{
                // latitude: data?.position?.lat || 37.78825,
                // longitude: data?.position?.lng || -122.4324,
                latitude: data?.position?.lat,
                longitude: data?.position?.lng,
                latitudeDelta: 0.0043,
                longitudeDelta: 0.0034,
              }}>
              <Marker
                coordinate={{
                  latitude: data?.position?.lat,
                  longitude: data?.position?.lng,
                }}
                title={t('home.clean_location_marker2')}
                // description={t('home.marker_description')}
              />
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
            <View style={[styles.detailsItem, {borderTopWidth: 0, gap: 4}]}>
              <Text
                fontType={'roboto'}
                bold
                center
                style={{
                  fontSize: 28,
                  marginBottom: 24,
                  color: '#000',
                }}>{t('amendRequest.title')}</Text>
              <View style={{flexDirection: 'row'}}>
                <View style={{flex: 1}}>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>{t('amendRequest.amended_by')}</Text>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    capitalized
                    semibold
                    style={{fontSize: 16}}>
                    {data?.cleaner?.first_name}
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <AmendCountDown />
                </View>
              </View>
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

              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>{t('amendRequest.note_label')}</Text>
              <Text
                color={colors.brandSecondary}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('amendRequest.auto_accept_warning')}</Text>
            </View>
            <View style={styles.btnContainer}>
              <Button
                text={t('amendRequest.accept')}
                pressed={() => handleAccept()}
                height={52}
                style={{
                  width: '47%',
                  backgroundColor: '#0CBC87',
                  borderRadius: 8,
                  marginVertical: 16,
                }}
              />
              <Button
                text={t('amendRequest.decline')}
                pressed={() => handleDecline()}
                height={52}
                style={{
                  width: '47%',
                  backgroundColor: '#D6293E',
                  borderRadius: 8,
                  marginVertical: 16,
                }}
              />
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
                  style={{fontSize: 12}}>{t('amendRequest.price_tax_inclusive')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {data?.country?.currency || 'CAD $'}{' '}
                  {Number(getDisplayedCurrentTaxInclusiveAmount()).toFixed(2)}
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
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.amended_price')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {data?.country?.currency || 'CAD $'}{' '}
                  {Number(getDisplayedAmendedTaxInclusiveAmount()).toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailsItemInner}>
                {/* <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>{t('amendRequest.new_estimated_time')}</Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {calcTimeEst(clean?.clean_amend?.duration)}
                </Text> */}
              </View>
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
                  {clean?.clean_amend?.bedrooms}
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
                  {clean?.clean_amend?.washrooms}
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
                  {clean?.clean_amend?.kitchens}
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
                  {clean?.clean_amend?.otherrooms}
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
                  {clean?.clean_amend?.livingrooms}
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
                  {clean?.clean_amend?.dinningrooms}
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
                  {clean?.clean_amend?.laundryrooms}
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
                  {clean?.clean_amend?.officerooms}
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
                    {clean?.clean_amend?.extras?.refridgerator}
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
                    {clean?.clean_amend?.extras?.stove}
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
                    {clean?.clean_amend?.extras?.dish_washer}
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
                    {clean?.clean_amend?.extras?.microwave}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.detailsItem]}>
              <View style={styles.detailsItemInner}>
                <Text
                  color={'#525354'}
                  fontType={'roboto'}
                  style={{fontSize: 12}}>
                  {t('amendRequest.amendment_comment')}
                </Text>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  style={{fontSize: 16}}>
                  {clean?.clean_amend?.ammendment_comment}
                </Text>
              </View>
              {/* <Button
                pressed={handleContactSupport}
                style={{
                  borderRadius: 8,
                  marginTop: 8,
                  backgroundColor: colors.brandGreen,
                }}
                text={t('contactUs.title')}
              /> */}
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default AmendRequest;

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // bottom: -25,
    bottom: 0,
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
