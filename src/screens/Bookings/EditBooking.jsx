import React, {useCallback, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Pressable,
} from 'react-native';
import {ScheduleOccurrenceData} from '../../utils/data';
import Text from '../../components/Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useFormik} from 'formik';
import {doubleSelectStyle, flexBetween} from '../../config/styles';
import NumberSelect from '../../components/Inputs/NumberSelect';
import IconButton from '../../components/Buttons/IconButton';
import FuntionButton from '../../components/Buttons/FuntionButton';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Modal1 from '../../components/Modals/Modal1';
import {formHandler} from '../../utils/formhandler';
import TextInputField from '../../components/Inputs/TextInputField';
import {editBookings} from '../../store/actions/bookings/editBookings';
import Select from '../../components/Inputs/Select';
import Datepicker from '../../components/Inputs/DatePicker';
import {combineTimeAndDate} from '../../utils/timeformatter';
import {formatDateOnly} from '../../utils/dateOnly';
import {useTranslation} from 'react-i18next';

const {width, height} = Dimensions.get('window');

const EditBooking = ({route}) => {
  const {t} = useTranslation();
  const {data} = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {pending} = useSelector(state => state.bookings);
  const bottomSheetRef = useRef();

  const {authenticated: authenticatedData} = useSelector(state => state.data);

  const form = useFormik({
    initialValues: {
      bedrooms_min: 1,

      bedrooms: data?.bedrooms,
      washrooms: data?.washrooms,
      kitchens: data?.kitchens,
      otherrooms: data?.otherrooms,
        
      livingrooms: data?.livingrooms,
      dinningrooms: data?.dinningrooms,
      laundryrooms: data?.laundryrooms,
      officerooms: data?.officerooms,

      refridgerator: data?.extras?.refridgerator,
      stove: data?.extras?.stove,
      stove_min: data?.clean_type_id === 2 || data?.clean_type_id === 3 ? 1 : 0,
      dish_washer_min: data?.clean_type_id === 2 ? 1 : 0,
      dish_washer: data?.extras?.dish_washer,
      microwave: data?.extras?.microwave,
      microwave_min:
        data?.clean_type_id === 2 || data?.clean_type_id === 3 ? 1 : 0,

      schedule_date: formatDateOnly(data?.schedule_date),
      schedule_time: data?.schedule_date,
      frequency: authenticatedData?.options.frequencies?.find(
        item => item?.id === data?.frequency,
      ),
      occurrence: ScheduleOccurrenceData?.find(
        item => item?.id === data?.occurrence,
      ),
      notes: '',
      status: 1,
    },
    onSubmit: values => {
      const payload = {
        location: data?.location,
        position: data?.position,
        clean_type_id: data?.clean_type_id,
        cleaners: data?.cleaners,

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

        delete: false,
        type: data?.type,

        frequency: data?.type === 1 ? values?.frequency?.id : 0,
        occurrence: data?.type === 1 ? 1 : 0,
        schedule_date:
          data?.type === 1 || data?.type === 2
            ? combineTimeAndDate(values?.schedule_date, values?.schedule_time)
            : '',
        status: 1,
      };

      dispatch(editBookings({data: payload, id: data?.id, navigation}));
    },
  });

  useFocusEffect(useCallback(() => {}, []));

  const handleSheetChanges = useCallback(index => {}, []);

  const [showModal, setShowModal] = useState(false);

  return (
    <SafeAreaView
      onPress={() => Keyboard.dismiss()}
      style={{flex: 1, width, height}}>
      <GestureHandlerRootView style={{flex: 1, zIndex: 10}}>
        {/* <Pressable
          onPress={() => {
            Keyboard.dismiss();
          }}
          style={{
            flex: 1,
            position: 'relative',
            // height: 90,
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
                latitude: data?.position?.lat,
                longitude: data?.position?.lng,
                latitudeDelta: 0.0043,
                longitudeDelta: 0.0034,
              }}
              customMapStyle={mapStyle}>
              <Marker
                coordinate={{
                  latitude: data?.position?.lat,
                  longitude: data?.position?.lng,
                }}
                title={t('home.my_location')}
                description={t('home.marker_description')}
              />
            </MapView>
          )}
        </Pressable> */}

        <BottomSheet
          enableDynamicSizing={false}
          ref={bottomSheetRef}
          index={0}
          style={{backgroundColor: 'transparent'}}
          snapPoints={['100%']}
          onChange={handleSheetChanges}>
          <BottomSheetScrollView contentContainerStyle={styles.mainContainer}>
            <Pressable onPress={() => Keyboard.dismiss()}>
              <Text style={{fontSize: 20}} semibold center fontType={'roboto'}>{t('booking.edit_booking')}</Text>
            </Pressable>

            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={{
                paddingHorizontal: 18,
                marginTop: 12,
              }}>
              {/* <TouchableOpacity
                    onPress={() => {
                      // bottomSheetRef.current.snapToPosition(1);
                      bottomSheetRef.current.snapToIndex(1);
                      // bottomSheetRef.current
                      // bottomSheetRef.current.close();
                    }}> */}

              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Bedrooms',
                    id: 'bedrooms',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Washrooms',
                    id: 'washrooms',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Kitchens',
                    id: 'kitchens',
                  }}
                />
                <NumberSelect
                  moreInfo
                  onClickMoreInfo={() => setShowModal(true)}
                  form={form}
                  item={{
                    name: 'Other Rooms',
                    id: 'otherrooms',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Living/Family Rooms',
                    id: 'livingrooms',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Dinning Rooms',
                    id: 'dinningrooms',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Laundry Rooms',
                    id: 'laundryrooms',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Office/Den Rooms',
                    id: 'officerooms',
                  }}
                />
              </View>

              <Text medium style={{fontSize: 14, marginTop: 30}}>{t('booking.extras_optional')}</Text>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Refrigerators',
                    id: 'refridgerator',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Stoves',
                    id: 'stove',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Dish Washer',
                    id: 'dish_washer',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: 'Microwave',
                    id: 'microwave',
                  }}
                />
              </View>
              
              <View>
                <TextInputField
                  custom
                  style={{borderColor: '#000'}}
                  {...formHandler('notes', form)}
                  placeholder=""
                  label={t('booking.notes_optional')}
                  mainStyles={{width: '100%'}}
                />
              </View>

              {data?.type === 1 && (
                <>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      // paddingHorizontal: 18,
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
                  <View style={[doubleSelectStyle]}>
                    <Datepicker
                      custom
                      label={t('booking.schedule_date_time')}
                      {...formHandler('schedule_date', form)}
                      mode={'date'}
                      placeholder={t('home.placeholder_date')}
                    />
                    <Datepicker
                      custom
                      label={t('booking.schedule_date_time')}
                      {...formHandler('schedule_time', form)}
                      mode={'time'}
                      placeholder={t('home.placeholder_time')}
                    />
                  </View>
                </>
              )}
              {data?.type === 2 && (
                <View style={[doubleSelectStyle]}>
                  <Datepicker
                    custom
                    label={t('booking.schedule_date_time')}
                    {...formHandler('schedule_date', form)}
                    mode={'date'}
                    placeholder={t('home.placeholder_date')}
                  />
                  <Datepicker
                    custom
                    label={t('booking.schedule_date_time')}
                    {...formHandler('schedule_time', form)}
                    mode={'time'}
                    placeholder={t('home.placeholder_time')}
                  />
                </View>
              )}

              <View
                style={[
                  flexBetween,
                  {
                    flexDirection: 'row',
                  },
                ]}>
                <IconButton
                  onPress={() => navigation.goBack()}
                  type={'arrow-left'}
                />
                <FuntionButton
                  loading={pending}
                  disabled={pending}
                  onPress={form.handleSubmit}
                  name={t('editBooking.submit')}
                />
              </View>
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheet>
        {showModal && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}>
            <Modal1
              style={{
                position: 'relative',
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                height: 'auto',
                paddingVertical: 10,
                justifyContent: 'space-evenly',
                height: 300,
                alignItems: 'center',
              }}
              setShowModal={setShowModal}>
              <View
                style={{
                  alignItems: 'center',
                  gap: 20,
                  width: '75%',
                }}>
                <Text style={{fontSize: 20, color: '#252525'}} center>{t('booking.other_rooms_info')}</Text>
              </View>
            </Modal1>
          </View>
        )}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default EditBooking;

const styles = StyleSheet.create({
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
});
