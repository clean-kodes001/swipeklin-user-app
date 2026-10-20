import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Image, StyleSheet, View} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {useDispatch, useSelector} from 'react-redux';
import {clean} from '../../store/actions/dashboard/clean';
import {logHelper} from '../../utils/logHelper';
import {
  StripeProvider,
  confirmPayment,
  createPaymentMethod,
  useStripe,
} from '@stripe/stripe-react-native';
import {showToast} from '../../utils/showToast';
import WebView from 'react-native-webview';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetModalProvider,
  TouchableOpacity,
} from '@gorhom/bottom-sheet';
import {Client} from '../../config/client';
import {proccessErrorMessage} from '../../utils/proccessErrorMessage';
import {useTranslation} from 'react-i18next';
import {APPLY_REFERRAL, CALCULATE_PRICE} from '../../config/apis';

const SuccessMessage = ({navigation, route}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {
    initPaymentSheet,
    presentPaymentSheet,
    canAddCardToWallet,
    collectBankAccountForPayment,
    collectBankAccountForSetup,
  } = useStripe();
  const {data, type} = route.params;
  const cleanCalculateData = useSelector(
    state => state.user?.cleanCalculateData,
  );

  const currency = data?.currency ?? '';
  const originalAmount = Number(data?.amount ?? 0);
  const discountedAmount = Number(data?.discounted_amount ?? data?.amount ?? 0);
  const amountSaved = Number(data?.amount_saved ?? 0);
  const isDiscounted = Boolean(data?.is_discounted) && amountSaved > 0;

  const formatAmount = value => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
  };

  // ---- Referral / promo code state ----
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  console.log('data===>', data);
  console.log('cleanCalculateData===>', cleanCalculateData);

  const initializePaymentSheet = async cleanData => {
    const {customer, ephemeral_key, payment_intent} = cleanData?.payment;
    const {name, id, email, phone} = customer;

    try {
      const res = await initPaymentSheet({
        merchantDisplayName: 'SwipeKlin',
        customerId: id,
        customerEphemeralKeySecret: ephemeral_key,
        paymentIntentClientSecret: payment_intent?.client_secret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: name,
          email: email,
          phone: phone,
          address: {
            country: 'CA',
          },
        },
      });
    } catch (error) {
      showToast({
        type: 0,
        message: error,
      });
    }
  };

  const {clean: cleanData} = useSelector(state => state.user);

  // ---- Apply referral / promo code ----
  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      showToast({type: 0, message: 'Please enter a referral code'});
      return;
    }
    setPromoLoading(true);
    Client({
      method: 'POST',
      path: APPLY_REFERRAL,
      data: {
        referral_code: promoCode.trim(),
      },
    })
      .then(({data: res}) => {
        setAppliedPromo(res);
        showToast({type: 1, message: res?.message || 'Referral code applied'});
        return Client({
          method: 'POST',
          path: CALCULATE_PRICE,
          data: cleanCalculateData,
        });
      })
      .then(({data: calcRes}) => {
        setPromoLoading(false);
        if (calcRes?.clean) {
          navigation.setParams({data: calcRes.clean});
        }
      })
      .catch(() => {
        setPromoLoading(false);
      });
  };

  const [pendingState, setPendingState] = useState(null);

  const findCleaners = async cleanCalculateData => {
    dispatch(
      clean({
        data: {
          ...cleanCalculateData,
          amount: discountedAmount,
          payment_intent_id: null,
        },
        navigation,
        callBack: async cleanData => {
          if (cleanData?.payment.status === 'pending') {
            try {
              setPendingState(cleanData);
              await initializePaymentSheet(cleanData);
              const response = await presentPaymentSheet();

              if (response.error) {
                showToast({
                  type: 0,
                  message: response.error.message,
                });
              } else {
                dispatch(
                  clean({
                    data: {
                      ...cleanCalculateData,
                      amount: discountedAmount,
                      payment_intent_id: cleanData?.payment?.payment_intent?.id,
                    },
                    navigation,
                    callBack: async cleanData => {
                      if (cleanData?.payment.status === 'success') {
                        navigation.replace('dashboarddetails', {
                          data: cleanData,
                        });
                      }
                    },
                  }),
                );
              }
            } catch (error) {}
          } else if (cleanData?.payment.status === 'success') {
            navigation.replace('dashboarddetails', {data: cleanData});
          }
        },
      }),
    );
  };

  const handleContinue = () => {
    navigation.replace('dashboarddetails', {data});
  };

  const handleSheetChanges = useCallback(index => {}, []);

  const bottomSheetRef = useRef();

  const [showbottomSheet, setShowbottomSheet] = useState(true);

  const submitBooking = cleanCalculateData => {
    dispatch(
      clean({
        data: {
          ...cleanCalculateData,
          amount: discountedAmount,
          payment_intent_id: null,
        },
        navigation,
        callBack: async cleanData => {
          if (cleanData?.payment.status === 'pending') {
            try {
              setPendingState(cleanData);
              await initializePaymentSheet(cleanData);
              const response = await presentPaymentSheet();
              if (response.error) {
                showToast({
                  type: 0,
                  message: response.error.message,
                });
              } else {
                dispatch(
                  clean({
                    data: {
                      ...cleanCalculateData,
                      amount: discountedAmount,
                      payment_intent_id: cleanData?.payment?.payment_intent?.id,
                    },
                    navigation,
                    callBack: async cleanData => {
                      if (cleanData?.payment.status === 'success') {
                        navigation.replace('dashboard', {screen: 'Bookings'});
                      }
                    },
                  }),
                );
              }
            } catch (error) {}
          } else if (cleanData?.payment.status === 'success') {
            navigation.replace('dashboard', {screen: 'Bookings'});
          } else if (cleanData === null) {
            navigation.replace('dashboard', {screen: 'Bookings'});
          }
        },
      }),
    );
  };

  // ---- Referral / promo code input block ----
  const renderPromoCode = () => (
    <View style={{width: '100%', marginVertical: 8}}>
      <TextInputField
        value={promoCode}
        onChangeText={setPromoCode}
        placeholder="Promo Code"
        label="Promo Code"
        editable={!promoLoading}
        mainStyles={{width: '100%'}}
      />
      <Button
        text={promoLoading ? 'Applying...' : 'Apply'}
        pressed={handleApplyPromo}
        disabled={promoLoading}
        height={44}
        style={{width: '100%', borderRadius: 8, marginTop: 8}}
      />
      {appliedPromo && (
        <Text
          notCapitalized
          style={{fontSize: 13, color: '#27AE60', marginTop: 6}}>
          {appliedPromo?.message || 'Promo code applied'}
        </Text>
      )}
    </View>
  );

  return (
    <>
      {cleanData?.payment.status === 'pending' ||
      pendingState?.payment.status === 'pending' ? (
        <StripeProvider
          publishableKey={
            cleanData?.payment.publishableKey ||
            pendingState?.payment.publishableKey
          }
          urlScheme="www.swipeklin.com://dashboard"
          merchantIdentifier="merchant.com.SwipeKlin">
          <ScreenContainer
            safeLeft={false}
            safeRight={false}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
            <View
              style={{
                alignItems: 'center',
                width: '100%',
                height: '70%',
                justifyContent: 'space-evenly',
                paddingHorizontal: 24,
              }}>
              <Image
                style={{width: 120, height: 120}}
                source={require('../../assets/media/icons/tick.png')}
              />
              {type === 'cleanCalculate' ? (
                <>
                  <Text
                    fontType={'roboto'}
                    center
                    medium
                    style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
                    {`${t('successMessage.total_cost')} (${currency} ${formatAmount(
                      isDiscounted ? discountedAmount : originalAmount,
                    )}).`}
                  </Text>
                  {isDiscounted && (
                    <>
                      <Text
                        fontType={'roboto'}
                        center
                        medium
                        style={{
                          fontSize: 16,
                          marginBottom: 4,
                          lineHeight: 20,
                          textDecorationLine: 'line-through',
                          opacity: 0.75,
                        }}>
                        {`${t('successMessage.original_label')} ${currency} ${formatAmount(
                          originalAmount,
                        )}`}
                      </Text>
                      <Text
                        fontType={'roboto'}
                        center
                        medium
                        style={{
                          fontSize: 16,
                          marginBottom: 8,
                          lineHeight: 24,
                          color: '#16a34a',
                          fontWeight: '700',
                        }}>
                        {`${t('successMessage.you_save')} ${currency} ${formatAmount(amountSaved)}`}
                      </Text>
                    </>
                  )}

                  {renderPromoCode()}

                  <Text
                    fontType={'roboto'}
                    center
                    medium
                    style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
                    {t('successMessage.find_cleaner_prompt')}
                  </Text>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      justifyContent: 'space-between',
                    }}>
                    <Button
                      outline
                      text={t('cleanDetails.cancel_button')}
                      pressed={() => {
                        navigation.goBack();
                      }}
                      height={52}
                      style={{
                        width: '47%',
                        borderRadius: 8,
                        marginVertical: 16,
                      }}
                    />
                    <Button
                      text={t('successMessage.find_cleaner_button')}
                      disabled={data?.payment?.status === 'error'}
                      pressed={() => findCleaners(cleanCalculateData)}
                      height={52}
                      style={{
                        width: '47%',
                        borderRadius: 8,
                        marginVertical: 16,
                      }}
                    />
                  </View>
                </>
              ) : type === 'clean' ? (
                <>
                  <Text
                    fontType={'roboto'}
                    center
                    medium
                    style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
                    {t('successMessage.successfully_requested')}
                  </Text>
                  <Button
                    text={t('successMessage.view_details')}
                    pressed={handleContinue}
                    height={52}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      marginVertical: 16,
                    }}
                  />
                </>
              ) : null}
            </View>
          </ScreenContainer>
        </StripeProvider>
      ) : (
        <ScreenContainer
          safeLeft={false}
          safeRight={false}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 12,
          }}>
          <View
            style={{
              alignItems: 'center',
              width: '100%',
              height: '70%',
              justifyContent: 'space-evenly',
              paddingHorizontal: 24,
            }}>
            <Image
              style={{width: 120, height: 120}}
              source={require('../../assets/media/icons/tick.png')}
            />
            {type === 'cleanCalculate' ? (
              <>
                <Text
                  fontType={'roboto'}
                  center
                  medium
                  style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
                  {`${t('successMessage.total_cost')} (${currency} ${formatAmount(
                    isDiscounted ? discountedAmount : originalAmount,
                  )}).`}
                </Text>
                {isDiscounted && (
                  <>
                    <Text
                      fontType={'roboto'}
                      center
                      medium
                      style={{
                        fontSize: 16,
                        marginBottom: 4,
                        lineHeight: 24,
                        textDecorationLine: 'line-through',
                        opacity: 0.75,
                      }}>
                      {`${t('successMessage.original_label')} ${currency} ${formatAmount(
                        originalAmount,
                      )}`}
                    </Text>
                    <Text
                      fontType={'roboto'}
                      center
                      medium
                      style={{
                        fontSize: 16,
                        marginBottom: 8,
                        lineHeight: 24,
                        color: '#16a34a',
                        fontWeight: '700',
                      }}>
                      {`${t('successMessage.you_save')} ${currency} ${formatAmount(amountSaved)}`}
                    </Text>
                  </>
                )}

                {renderPromoCode()}

                {cleanCalculateData?.type === 0 && (
                  <Text
                    fontType={'roboto'}
                    center
                    medium
                    style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
                    {t('successMessage.find_cleaner_prompt')}
                  </Text>
                )}
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}>
                  <Button
                    outline
                    text={t('common.back')}
                    pressed={() => {
                      navigation.goBack();
                    }}
                    height={52}
                    style={{
                      width: '47%',
                      borderRadius: 8,
                      marginVertical: 16,
                    }}
                  />
                  {cleanCalculateData?.type !== 0 ? (
                    <Button
                      text={t('editBooking.submit')}
                      pressed={() => submitBooking(cleanCalculateData)}
                      height={52}
                      style={{
                        width: '47%',
                        borderRadius: 8,
                        marginVertical: 16,
                      }}
                    />
                  ) : (
                    <Button
                      text={t('successMessage.find_cleaner_button')}
                      pressed={() => findCleaners(cleanCalculateData)}
                      height={52}
                      style={{
                        width: '47%',
                        borderRadius: 8,
                        marginVertical: 16,
                      }}
                    />
                  )}
                </View>
              </>
            ) : type === 'clean' ? (
              <>
                <Text
                  fontType={'roboto'}
                  center
                  medium
                  style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
                  {t('successMessage.successfully_requested')}
                </Text>
                <Button
                  text={t('successMessage.view_details')}
                  pressed={handleContinue}
                  height={52}
                  style={{width: '100%', borderRadius: 8, marginVertical: 16}}
                />
              </>
            ) : null}
          </View>
        </ScreenContainer>
      )}
    </>
  );
};

export default SuccessMessage;

const styles = StyleSheet.create({});