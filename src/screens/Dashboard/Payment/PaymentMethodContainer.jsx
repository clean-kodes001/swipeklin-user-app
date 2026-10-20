import Text from '../../../components/Shared/Text';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Pressable,
  ActivityIndicator,
  Keyboard,
  StyleSheets,
  Platform,
  ImageBackground,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../../config/colors';
import EmptyState from '../../../components/Shared/EmptyState';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {useDispatch, useSelector} from 'react-redux';
import FuntionButton from '../../../components/Buttons/FuntionButton';
import {handleViewMore} from '../../../utils/viewMore';
import TextInputField from '../../../components/Inputs/TextInputField';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import CustomScrollView from '../../../components/Shared/CustomScrollView';

// App.ts
import {StripeProvider} from '@stripe/stripe-react-native';
// PaymentScreen.ts
import {CardField, useStripe} from '@stripe/stripe-react-native';
import Button from '../../../components/Shared/Button';
import PaymentMethod from './PaymentMethod';
import BottomSelect from '../../../components/Inputs/BottomSelect';
import {getPayment} from '../../../store/actions/payment/getPayment';
import Head from '../../../components/Shared/Head';
import {getPaymentMethods} from '../../../store/actions/payment/getPaymentMethods';
import {logHelper} from '../../../utils/logHelper';
import {deletePaymentMethod} from '../../../store/actions/payment/deletePaymentMethod';
import {addPaymentMethod} from '../../../store/reducer/paymentSlice';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {showToast} from '../../../utils/showToast';
import {useTranslation} from 'react-i18next';

const PaymentMethodBox = ({
  currID,
  index,
  paymentMethods,
  card,
  addCard,
  setCurrID,
  loadingRemove,
  id,
  loadingAdd,
  handleDeletePaymentMethod,
}) => {
  const {t} = useTranslation();
  return (
    <>
      <View
        style={{
          width: '95%',

          height: 100,
          borderColor: '#767676',

          borderRadius: 8,
          overflow: 'hidden',
          // zIndex: currID !== null ? (currID === id ? 2 : 0) : 2,
          // display:
          //   currID !== null ? (currID === index ? 'flex' : 'none') : 'flex',

          backgroundColor:
            paymentMethods?.customer?.invoice_settings
              ?.default_payment_method === id
              ? 'rgba(156, 237, 33,0.9)'
              : 'rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
        <ImageBackground
          style={{
            // borderRadius: 38,

            // paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 4,
            width: '100%',
            height: 100,
          }}
          source={require('../../../assets/media/images/bank-bg.png')}>
          <View
            style={{
              flex: 1,
              marginHorizontal: 20,
              zIndex: 2,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
            key={index}>
            <View>
              <Text
                fontType={'roboto'}
                medium
                style={{marginBottom: 12, fontSize: 26}}>
                {card.brand}
              </Text>
              <Text
                fontType={'roboto'}
                medium
                // color={colors.primaryText}
                style={{fontSize: 14}}>
                {`${card.exp_month < 10 ? '0' : ''}${card.exp_month}/${
                  card.exp_year
                }`}
              </Text>
            </View>
            <Text
              fontType={'roboto'}
              color={
                paymentMethods?.customer?.invoice_settings
                  ?.default_payment_method === id
                  ? '#FFF'
                  : '#000'
              }
              style={{fontSize: 18}}>
              ****{card?.last4}
            </Text>
          </View>
          <View
            style={{width: '100%', paddingRight: 20, alignItems: 'flex-end'}}>
            <TouchableOpacity
              onPress={() => setCurrID(prev => (prev != null ? null : id))}>
              <MaterialCommunityIcons
                style={{fontSize: 40}}
                color={
                  paymentMethods?.customer?.invoice_settings
                    ?.default_payment_method === id
                    ? '#FFF'
                    : '#000'
                }
                name={'dots-horizontal'}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      {currID == id && (
        <>
          <TouchableOpacity
            onPress={() => {
              setCurrID(null);
            }}
            style={{
              // backgroundColor: 'rgba(0,0,0,0.2)',
              position: 'absolute',
              top: 0,

              height: '100%',
              left: 0,
              // flex: 1,
              width: '100%',

              zIndex: 1,
            }}></TouchableOpacity>
          <View
            style={{
              borderRadius: 12,
              // position: 'relative',
              marginTop: -25,
              paddingVertical: 16,
              marginHorizontal: 12,
              paddingHorizontal: 20,
              zIndex: 50,
              backgroundColor: '#fff',
              width: 200,
              alignSelf: 'flex-end',
              overflow: 'hidden',
            }}>
            <TouchableOpacity
              onPress={() => addCard(id)}
              disabled={
                paymentMethods?.customer?.invoice_settings
                  ?.default_payment_method === id
              }
              style={{
                width: '100%',
                borderRadius: 12,
                marginBottom: 16,
                alignItems: 'center',
              }}>
              {loadingAdd ? (
                <ActivityIndicator color={'#000'} />
              ) : (
                <Text
                  fontType={'roboto'}
                  medium
                  color={
                    paymentMethods?.customer?.invoice_settings
                      ?.default_payment_method === id
                      ? '#999'
                      : '#000'
                  }
                  // color={colors.primaryText}
                  style={{fontSize: 14}}>{t('payment.set_as_default_card')}</Text>
              )}
            </TouchableOpacity>
            {
              <TouchableOpacity
                disabled={
                  paymentMethods?.customer?.invoice_settings
                    ?.default_payment_method === id
                }
                onPress={() => handleDeletePaymentMethod(id)}
                style={{width: '100%', alignItems: 'center'}}>
                {loadingRemove ? (
                  <ActivityIndicator color={'#000'} />
                ) : (
                  <Text
                    fontType={'roboto'}
                    medium
                    color={
                      paymentMethods?.customer?.invoice_settings
                        ?.default_payment_method === id
                        ? '#999'
                        : '#000'
                    }
                    style={{fontSize: 14}}>{t('payment.remove_card')}</Text>
                )}
              </TouchableOpacity>
            }
          </View>
        </>
      )}
    </>
  );
};

const PaymentMethodContainer = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [showbottomSheet, setShowbottomSheet] = useState(false);

  const {user} = useSelector(state => state.user);

  const {paymentMethods} = useSelector(state => state.payment);

  const {payments, paymentData, pending, allPending} = useSelector(
    state => state.payment,
  );

  const [lastViewedList, setLastViewedList] = useState([]);
  const [token, setToken] = useState(null);
  const [list, setList] = useState([]);
  const [nextPage, setNextPage] = useState();
  const [prevPage, setPrevPage] = useState();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (payments?.data?.length > 0) {
      setList(paymentData);
      setLastViewedList(paymentData);
      setNextPage(payments?.next_page_url);
      setPrevPage(payments?.prev_page_url);
    }
  }, [paymentData, payments]);

  const handleRefresh = () => {
    dispatch(getPaymentMethods());
  };

  const [currID, setCurrID] = useState(null);
  const [loadingAdd, setLoadingAdd] = useState(null);
  const [loadingRemove, setLoadingRemove] = useState(null);

  const handleDeletePaymentMethod = id => {
    setLoadingRemove(true);
    dispatch(
      deletePaymentMethod({
        id,
        cb: () => {
          setCurrID(null);
          setLoadingRemove(false);
        },
      }),
    );
  };

  const addCard = async id => {
    try {
      setLoadingAdd(true);
      const {
        data: {payment},
      } = await Client({
        method: 'POST',
        path: 'payment-methods/create',
        data: {
          payment_method_id: id,
        },
      });

      dispatch(addPaymentMethod(payment));
      setCurrID(null);
      setLoadingAdd(false);
      return payment;
    } catch (error) {
      const msg = proccessErrorMessage(error);
      showToast({
        type: 0,
        message: msg,
      });
      setLoadingAdd(false);
    }
  };

  const renderPaymentMethods = (item, index) => {
    const {card, id} = item;
    return (
      <PaymentMethodBox
        addCard={addCard}
        card={card}
        id={id}
        currID={currID}
        index={index}
        loadingAdd={loadingAdd}
        loadingRemove={loadingRemove}
        paymentMethods={paymentMethods}
        handleDeletePaymentMethod={handleDeletePaymentMethod}
        setCurrID={setCurrID}
        key={index}
      />
    );
  };

  useEffect(() => {
    dispatch(getPaymentMethods());
  }, [dispatch]);

  return (
    <>
      <View
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#fff',
        }}>
        <View
          style={{
            paddingTop: insets.top > 0 ? insets.top : 20,
            paddingHorizontal: 20,
            borderBottomColor: '#e5e5e5',
            borderBottomWidth: 2,
            backgroundColor: '#f3f5f7',
          }}>
          <Head
            pageTitle={t('payment.my_cards')}
            secondButtonTitle={'Add'}
            handleSecondButton={() => {
              setShowbottomSheet(true);
              console.log('clicked');
            }}
            type={2}
            navigation={navigation}
          />
        </View>

        <View
          style={{
            flex: 1,
          }}>
          <CustomScrollView
            canRefresh={!pending && !allPending}
            onRefresh={handleRefresh}
            styles={{
              paddingBottom: 80 + insets.bottom,

              // minHeight: '100%',
              // flex: 1,
              // justifyContent: 'space-between',
              height: '100%',

              alignItems: 'center',
              paddingTop: 12,
              gap: 20,
              display: 'flex',
            }}>
            {pending || allPending || !paymentMethods ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 300,
                }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : paymentMethods?.methods?.data?.length ? (
              <>
                {paymentMethods?.methods?.data
                  ?.filter(
                    item =>
                      item.id ===
                      paymentMethods?.customer?.invoice_settings
                        ?.default_payment_method,
                  )
                  .map(renderPaymentMethods)}
                {paymentMethods?.methods?.data
                  ?.filter(
                    item =>
                      item.id !==
                      paymentMethods?.customer?.invoice_settings
                        ?.default_payment_method,
                  )
                  ?.map(renderPaymentMethods)}
              </>
            ) : (
              <>
                <EmptyState
                  text={t('payment.no_payment_methods')}
                  lottie={require('../../../assets/media/animations/empty_box.json')}
                />
              </>
            )}
          </CustomScrollView>
        </View>

        <PaymentMethod
          showBottomSheet={showbottomSheet}
          handleShowbottomSheet={setShowbottomSheet}
        />
      </View>
    </>
  );
};

export default PaymentMethodContainer;

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
