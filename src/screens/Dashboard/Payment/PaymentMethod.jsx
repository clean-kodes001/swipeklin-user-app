import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {StripeProvider} from '@stripe/stripe-react-native';
import {useStripe} from '@stripe/stripe-react-native';
import Button from '../../../components/Shared/Button';
import {View} from 'react-native';
import {showToast} from '../../../utils/showToast';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Keyboard, Platform, Dimensions} from 'react-native';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {Client} from '../../../config/client';
import {getPaymentMethods} from '../../../store/actions/payment/getPaymentMethods';
import {useTranslation} from 'react-i18next';

const PaymentMethod = ({showBottomSheet, handleShowbottomSheet}) => {
  const {t} = useTranslation();
  const defaultSnapPoints = useMemo(() => [200, '90%'], []);

  const dispatch = useDispatch();
  const bottomSheetRef = useRef();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;
  const {user} = useSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  const {paymentMethods} = useSelector(state => state.payment);

  // Calculate snap points that position sheet just above keyboard
  const calculatedSnapPoints = useMemo(() => {
    if (Platform.OS === 'ios' && keyboardHeight > 0) {
      // Position just above keyboard with ~30px spacing
      const heightAboveKeyboard = screenHeight - keyboardHeight - 30;
      return [200, heightAboveKeyboard];
    }
    // Default snap points when keyboard is not visible
    return defaultSnapPoints;
  }, [keyboardHeight, screenHeight, defaultSnapPoints]);

  // Listen to keyboard events
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const showSubscription = Keyboard.addListener('keyboardWillShow', e => {
        setKeyboardHeight(e.endCoordinates.height);
        // Snap to the calculated position after keyboard appears
        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(1);
        }, 100);
      });
      const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
        // Return to initial position when keyboard hides
        bottomSheetRef.current?.snapToIndex(0);
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }
  }, []);

  // Fetch PaymentSheet setup data from backend
  const fetchPaymentSheetSetup = useCallback(async () => {
    try {
      setInitializing(true);
      const {
        data: {customer, ephemeral_key, setup_intent, publishableKey},
      } = await Client({
        method: 'GET',
        path: 'payment-methods/setup',
        processError: false, // Don't auto-process error, we'll handle it
      });

      if (!customer || !ephemeral_key || !setup_intent?.client_secret) {
        throw new Error('Invalid response from server');
      }

      return {
        customer,
        ephemeral_key,
        setup_intent,
        publishableKey,
      };
    } catch (error) {
      // Extract error message properly
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to initialize payment sheet';

      showToast({
        type: 0,
        message: errorMessage,
      });
      setInitializing(false);
      return null;
    }
  }, []);

  // Initialize PaymentSheet with setup data
  const initializePaymentSheet = useCallback(
    async setupData => {
      if (!setupData) {
        return false;
      }

      const {customer, ephemeral_key, setup_intent} = setupData;
      const {name, id, email, phone} = customer || {};

      try {
        const result = await initPaymentSheet({
          merchantDisplayName: 'SwipeKlin',
          customerId: id,
          customerEphemeralKeySecret: ephemeral_key,
          setupIntentClientSecret: setup_intent?.client_secret,
          allowsDelayedPaymentMethods: false,
          returnURL: 'www.swipeklin.com://dashboard',
          defaultBillingDetails: {
            name: name || user?.name,
            email: email || user?.email,
            phone: phone || user?.phone,
          },
        });

        if (result.error) {
          showToast({
            type: 0,
            message:
              result.error.message || 'Failed to initialize payment sheet',
          });
          setPaymentSheetReady(false);
          setInitializing(false);
          return false;
        }

        setPaymentSheetReady(true);
        setInitializing(false);
        return true;
      } catch (error) {
        showToast({
          type: 0,
          message: error?.message || 'Failed to initialize payment sheet',
        });
        setPaymentSheetReady(false);
        setInitializing(false);
        return false;
      }
    },
    [initPaymentSheet, user?.name, user?.email, user?.phone],
  );

  // Present PaymentSheet and handle response
  const handlePresentPaymentSheet = async () => {
    if (!paymentSheetReady) {
      showToast({
        type: 0,
        message: t('payment.payment_sheet_not_ready'),
      });
      return;
    }

    try {
      setLoading(true);
      const {error} = await presentPaymentSheet();

      if (error) {
        showToast({
          type: 0,
          message: error.message || 'Payment sheet error',
        });
        setLoading(false);
        return;
      }

      // PaymentSheet successfully saved the card
      // Refresh payment methods list to show the new card
      dispatch(getPaymentMethods());
      showToast({
        message: t('payment.method_added_successfully'),
      });

      if (handleShowbottomSheet) {
        handleShowbottomSheet(false);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showToast({
        type: 0,
        message: error?.message || 'An error occurred',
      });
    }
  };

  // Initialize PaymentSheet when bottom sheet opens
  useEffect(() => {
    if (showBottomSheet) {
      const setupPaymentSheet = async () => {
        const setupData = await fetchPaymentSheetSetup();
        if (setupData) {
          await initializePaymentSheet(setupData);
        }
      };
      setupPaymentSheet();
    } else {
      // Reset state when bottom sheet closes
      setPaymentSheetReady(false);
      setInitializing(false);
    }
  }, [showBottomSheet, fetchPaymentSheetSetup, initializePaymentSheet]);

  // Control bottom sheet visibility
  useEffect(() => {
    if (showBottomSheet) {
      // Open bottom sheet - snap to first index
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    } else {
      // Close bottom sheet
      bottomSheetRef.current?.close();
      Keyboard.dismiss();
    }
  }, [showBottomSheet]);

  return (
    <StripeProvider
      publishableKey={paymentMethods?.publishableKey}
      urlScheme="www.swipeklin.com://dashboard"
      merchantIdentifier="merchant.com.SwipeKlin">
      <View
        pointerEvents={showBottomSheet ? 'box-none' : 'none'}
        style={{
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          // paddingHorizontal: 18,
          height: '100%',
          zIndex: 10,
          backgroundColor: 'transparent',
        }}>
        <GestureHandlerRootView style={{flex: 1}}>
          <BottomSheet
            enableDynamicSizing={false}
            onDismiss={() => {
              if (handleShowbottomSheet) {
                handleShowbottomSheet(false);
              }
              Keyboard.dismiss();
            }}
            enableDismissOnClose={true}
            ref={bottomSheetRef}
            index={-1}
            enablePanDownToClose={true}
            keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'extend'}
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            style={{
              backgroundColor: 'transparent',
            }}
            snapPoints={calculatedSnapPoints}>
            <BottomSheetScrollView
              contentContainerStyle={{
                paddingHorizontal: 18,
                paddingBottom: Platform.OS === 'ios' ? 20 : 0,
              }}>
              <View
                style={{
                  marginVertical: 20,
                  alignItems: 'center',
                }}>
                {initializing ? (
                  <Button
                    loading={true}
                    text={t('payment.initializing')}
                    height={52}
                    disabled={true}
                    style={{width: '100%', borderRadius: 8, marginVertical: 8}}
                  />
                ) : paymentSheetReady ? (
                  <Button
                    loading={loading}
                    text={t('payment.add_payment_method')}
                    height={52}
                    pressed={handlePresentPaymentSheet}
                    style={{width: '100%', borderRadius: 8, marginVertical: 8}}
                  />
                ) : (
                  <Button
                    disabled={true}
                    text={t('payment.unable_to_initialize')}
                    height={52}
                    style={{width: '100%', borderRadius: 8, marginVertical: 8}}
                  />
                )}
              </View>

              <View
                style={{
                  width: '100%',
                  alignItems: 'center',
                }}>
                <Button
                  outline
                  text={t('common.close')}
                  pressed={() => {
                    if (handleShowbottomSheet) {
                      handleShowbottomSheet(false);
                    }
                  }}
                  height={52}
                  style={{width: '100%', borderRadius: 8, marginVertical: 8}}
                />
              </View>
            </BottomSheetScrollView>
          </BottomSheet>
        </GestureHandlerRootView>
      </View>
    </StripeProvider>
  );
};

export default PaymentMethod;

// export const PaymentMethod2 = ({snapPoints, handleShowbottomSheet}) => {
//   const handleSheetChanges = useCallback(index => {}, []);
//   const dispatch = useDispatch();
//   const bottomSheetRef = useRef();
//   const {
//     initPaymentSheet,
//     presentPaymentSheet,
//     canAddCardToWallet,
//     collectBankAccountForPayment,
//     collectBankAccountForSetup,
//   } = useStripe();

//   const [loading, setLoading] = useState(false);

//   const {createPaymentMethod, handleNextAction} = useStripe();

//   const {paymentMethods} = useSelector(state => state.payment);

//   // console.log(paymentMethods, '==-32=432987r7898p');
//   // console.log(paymentMethods, '==-32=432987r7898p');
//   // console.log(paymentMethods?.methods?.data?.length, '==-32=432987r7898p');
//   // console.log(paymentMethods?.methods?.data[2], '==-32=432987r7898p');

//   const renderPaymentMethods = (item, index) => {
//     return (
//       <TouchableOpacity
//         style={{
//           width: 80,
//           height: 55,
//           borderColor: '#000',
//           borderWidth: 1,
//           borderRadius: 8,
//         }}
//         key={index}></TouchableOpacity>
//     );
//   };

//   const {user} = useSelector(state => state.user);

//   const addCard = async id => {
//     try {
//       const {
//         data: {payment},
//       } = await Client({
//         method: 'POST',
//         path: 'payment-methods/create',
//         data: {
//           payment_method_id: id,
//         },
//       });
//       dispatch(addPaymentMethod(payment));
//       showToast({
//         message: t('payment.method_added_successfully'),
//       });
//       return payment;
//     } catch (error) {
//       const msg = proccessErrorMessage(error);

//       showToast({
//         type: 0,
//         message: msg,
//       });
//     }
//   };

//   const pay = async () => {
//     // Gather customer billing information (for example, email)
//     const billingDetails = {
//       email: user?.email,
//       phone: user?.phone,
//       // addressCity: user?.,
//       // addressCountry: 'US',
//       // addressLine1: '1459  Circle Drive',
//       // addressLine2: 'Texas',
//       // addressPostalCode: '77063',
//     };

//     try {
//       // Create payment method
//       setLoading(true);
//       const {
//         paymentMethod,
//         error: paymentMethodError,
//         requires_action,
//         payment_intent_client_secret,
//       } = await createPaymentMethod({
//         paymentMethodType: 'Card',
//         paymentMethodData: {
//           billingDetails,
//         },
//       });
//       if (!paymentMethodError && paymentMethod) {
//         const payment = await addCard(paymentMethod.id);
//         handleShowbottomSheet(false);
//         setLoading(false);
//       } else {
//         setLoading(false);
//         showToast({
//           type: 0,
//           message:
//             paymentMethodError?.localizedMessage || paymentMethodError?.message,
//         });
//       }
//     } catch (error) {
//       setLoading(false);
//       // console.log(error);
//       showToast({
//         type: 0,
//         message: error?.message || error,
//       });
//     }
//   };

//   const handleDeletePaymentMethod = () => {
//     dispatch(
//       deletePaymentMethod({id: 'pm_1O9vEyHe3OcuAUuKh5eoMPYi', cb: () => {}}),
//     );
//   };

//   useEffect(() => {}, []);

//   return (
//     <GestureHandlerRootView style={{width: '100%', height: '100%'}}>
//       <BottomSheet
//         //   onDismiss={() => handleShowbottomSheet(false)}
//         enableDismissOnClose={true}
//         ref={bottomSheetRef}
//         // index={1}
//         style={{flex: 1}}
//         snapPoints={['50%', '100%']}
//         //   enablePanDownToClose={true}
//         // backdropComponent={render}
//         onChange={handleSheetChanges}>
//         <WebView source={{uri: 'https://reactnative.dev/'}} style={{flex: 1}} />
//       </BottomSheet>
//     </GestureHandlerRootView>
//   );
// };
