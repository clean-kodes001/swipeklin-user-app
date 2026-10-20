import React, {useCallback, useState} from 'react';
import Text from '../../components/Shared/Text';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {colors} from '../../config/colors';
import EmptyState from '../../components/Shared/EmptyState';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {useDispatch, useSelector} from 'react-redux';
import FuntionButton from '../../components/Buttons/FuntionButton';
import {handleViewMore} from '../../utils/viewMore';
import TextInputField from '../../components/Inputs/TextInputField';
import BottomSelect from '../../components/Inputs/BottomSelect';
import CustomScrollView from '../../components/Shared/CustomScrollView';
import {useFocusEffect} from '@react-navigation/native';
import {getBookings} from '../../store/actions/bookings/getBookings';
import BookingsItem from '../../components/Bookings/BookingsItem';
import {useTranslation} from 'react-i18next';

const activeStyle = {
  backgroundColor: '#F5F5F6',
  borderColor: '#c5c5c7',
  borderWidth: 1,
  paddingHorizontal: 8,
};

const Bookings = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const {user} = useSelector(state => state.user);
  const {authenticated: authenticatedData} = useSelector(state => state.data);
  const {bookings, bookingsData, pending, allPending} = useSelector(
    state => state.bookings,
  );

  const [filter, setFilter] = useState(0);
  const [showbottomSheet, setShowbottomSheet] = useState(false);
  const [lastViewedList, setLastViewedList] = useState([]);
  const [token, setToken] = useState(null);
  const [list, setList] = useState([]);
  const [nextPage, setNextPage] = useState();
  const [prevPage, setPrevPage] = useState();
  const [searchText, setSearchText] = useState('');
  const [stateOfDisplayList, setStateOfDisplayList] = useState('All');

  const searchEngine = text => {
    const lowerCaseText = text.toLowerCase();

    if (text.length > 0) {
      const dataToBeFiltered = [...lastViewedList];
      const filteredItems = dataToBeFiltered?.filter(item => {
        return item.location?.toLowerCase()?.includes(lowerCaseText);
      });
      setList(filteredItems);
    } else {
      setList(lastViewedList);
    }
  };

  const handleSearch = text => {
    setSearchText(text);
    searchEngine(text);
  };

  useFocusEffect(
    useCallback(() => {
      if (bookings?.data?.length > 0) {
        setList(bookingsData);
        setLastViewedList(bookingsData);
        setNextPage(bookings?.next_page_url);
        setPrevPage(bookings?.prev_page_url);
      }
    }, [bookingsData, bookings]),
  );

  const handleRenderOptions = (item, index) => {
    const check = filter === item.id;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          setShowbottomSheet(false);
          setFilter(item.id);
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 4,
          width: '100%',
          backgroundColor: check ? colors.primary : '#fff',
          paddingVertical: 16,
          paddingHorizontal: 20,
        }}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}>
          <FontAwesome
            name={check ? 'dot-circle-o' : 'circle-o'}
            size={20}
            color={check ? '#fff' : colors.primary}
          />
          <Text
            fontType={'roboto'}
            style={{
              fontSize: 16,
              color: check ? '#fff' : colors.primary,
            }}>
            {item.name}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          color={check ? '#fff' : colors.primary}
          size={26}
        />
      </TouchableOpacity>
    );
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(getBookings());
    }, []),
  );

  const renderBookingsData = (item, index) => {
    return (
      <View key={index} style={{flex: 1}}>
        <BookingsItem item={item} />
      </View>
    );
  };

  const handleRefresh = () => {
    dispatch(getBookings());
  };

  return false ? (
    <ScreenContainer style={{flex: 1, justifyContent: 'center'}}>
      <Text center>{t('booking.in_development')}</Text>
    </ScreenContainer>
  ) : (
    <SafeAreaView
      style={{
        flex: 1,
        // backgroundColor: '#b8b6b6'
      }}>
      <View style={{padding: 12, flex: 1}}>
        <Pressable onPress={() => Keyboard.dismiss()} style={styles.head}>
          <Text
            fontType={'roboto'}
            medium
            color={'#000'}
            style={{fontSize: 18}}>
            {t('booking.schedules')}
          </Text>
        </Pressable>
        {/* <TextInputField
          type={'search'}
          placeholder={t('home.search_by_location')}
          onChangeText={handleSearch}
          value={searchText}
        /> */}
        {/* <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 4,
            }}>
            <FuntionButton
              onPress={() => setStateOfDisplayList('All')}
              textStyle={{
                color: stateOfDisplayList === 'All' ? colors.primary : '#333',
                fontFamily: 'Roboto-Medium',
              }}
              style={
                stateOfDisplayList === 'All'
                  ? {
                      width: 60,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                      ...activeStyle,
                    }
                  : {
                      width: 60,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                    }
              }
              name={'All'}
            />
            <FuntionButton
              onPress={() => setStateOfDisplayList('Active')}
              textStyle={{
                fontFamily: 'Roboto-Medium',
                color:
                  stateOfDisplayList === 'Active' ? colors.primary : '#333',
              }}
              style={
                stateOfDisplayList === 'Active'
                  ? {
                      width: 65,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                      ...activeStyle,
                    }
                  : {
                      width: 65,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                    }
              }
              name={t('history.status_active')}
            />
            <FuntionButton
              onPress={() => setStateOfDisplayList('Disabled')}
              textStyle={{
                fontFamily: 'Roboto-Medium',
                color:
                  stateOfDisplayList === 'Disabled' ? colors.primary : '#333',
              }}
              style={
                stateOfDisplayList === 'Disabled'
                  ? {
                      width: 110,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                      ...activeStyle,
                    }
                  : {
                      width: 110,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                    }
              }
              name={t('common.disabled')}
            />
            <FuntionButton
              onPress={() => setStateOfDisplayList('Canceled')}
              textStyle={{
                fontFamily: 'Roboto-Medium',
                color:
                  stateOfDisplayList === 'Canceled' ? colors.primary : '#333',
              }}
              style={
                stateOfDisplayList === 'Canceled'
                  ? {
                      width: 110,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                      ...activeStyle,
                    }
                  : {
                      width: 110,
                      paddingHorizontal: 0,
                      backgroundColor: 'transparent',
                    }
              }
              name={t('common.canceled')}
            />
          </View>

          <FuntionButton
            onPress={() => setShowbottomSheet(true)}
            textStyle={{fontFamily: 'Roboto-Bold'}}
            name={t('common.filter')}
          />
        </View> */}
        {allPending ? (
          <SafeAreaView
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator size={'large'} />
          </SafeAreaView>
        ) : bookingsData && bookingsData?.length < 1 ? (
          <EmptyState text={t('booking.no_schedules')} />
        ) : (
          <CustomScrollView
            canRefresh={!pending && !allPending}
            onRefresh={handleRefresh}
            styles={{
              paddingBottom: 80,
              minHeight: '60%',
              justifyContent: 'space-between',
              display: 'flex',
            }}>
            {[...list].filter(
              item =>
                (stateOfDisplayList === 'Active'
                  ? item.status === 1
                  : stateOfDisplayList === 'Disabled'
                  ? item.status === 2 || item.status === 8 || item.status === 0
                  : stateOfDisplayList === 'All') &&
                (filter === 0 ? true : filter === item.clean_type_id),
            ).length < 1 ? (
              <View
                style={{
                  height: '75%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  fontType={'roboto'}
                  light
                  color={'#000'}
                  style={{fontSize: 24}}>
                  {t('booking.no_schedules_found')}
                </Text>
              </View>
            ) : (
              <></>
            )}
            {[...list]
              .filter(
                item =>
                  (stateOfDisplayList === 'Active'
                    ? item.status === 1
                    : stateOfDisplayList === 'Disabled'
                    ? item.status === 2 ||
                      item.status === 8 ||
                      item.status === 0
                    : stateOfDisplayList === 'All') &&
                  (filter === 0 ? true : filter === item.clean_type_id),
              )
              .map(renderBookingsData)}
            {nextPage || true ? (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                }}>
                <FuntionButton
                  loading={pending}
                  disabled={!nextPage || pending}
                  style={{marginBottom: 0, justifySelf: 'flex-end'}}
                  onPress={() =>
                    handleViewMore({
                      dispatch,
                      pageUrl: nextPage,
                      distructurer: 'bookings',
                      setNextPage,
                      setPrevPage,
                      setPage: setList,
                      setLastViewedList,
                    })
                  }
                  name={t('common.more')}
                />
              </View>
            ) : (
              <></>
            )}
          </CustomScrollView>
        )}
      </View>
      {showbottomSheet && (
        <BottomSelect
          snapPoints={[400, 400]}
          handleShowbottomSheet={setShowbottomSheet}>
          {[{id: 0, name: 'All'}, ...authenticatedData?.clean_types]?.map(
            handleRenderOptions,
          )}
        </BottomSelect>
      )}
    </SafeAreaView>
  );
};

export default Bookings;

const styles = StyleSheet.create({
  head: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    // paddingVertical: 12,
    // marginVertical: 8,
    paddingVertical: 6,
    marginVertical: 4,
  },
});
