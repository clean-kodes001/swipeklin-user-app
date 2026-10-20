import React, {useEffect} from 'react';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {View} from 'react-native';
import Head from '../../components/Shared/Head';
import {useNavigation} from '@react-navigation/native';
import BookingsItem from '../../components/Bookings/BookingsItem';
import {useDispatch, useSelector} from 'react-redux';
import {clearUpdatedBooking} from '../../store/reducer/bookingsSlice';
import {useTranslation} from 'react-i18next';

const BookingDetails = ({route}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {updatedBooking} = useSelector(state => state.bookings);
  const navigation = useNavigation();
  const item = updatedBooking || route.params.item;

  useEffect(() => {
    return () => {
      dispatch(clearUpdatedBooking());
    };
  }, []);
  return (
    <ScreenContainer style={{flex: 1, padding: 12}}>
      <Head
        navigation={navigation}
        pageTitle={t('booking.schedule_information')}
        type={2}
      />
      <View style={{flex: 1}}>
        <BookingsItem type={2} item={item} />
      </View>
    </ScreenContainer>
  );
};

export default BookingDetails;
