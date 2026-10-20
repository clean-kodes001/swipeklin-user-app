import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Pusher from 'pusher-js/react-native';
import Echo from 'laravel-echo';
import pusherConfig from '../../../pusher.json';
import {useFocusEffect} from '@react-navigation/native';
import {getClean} from '../../store/actions/dashboard/getClean';
import CleanDetails from './CleanDetails';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearCleanRequest,
  clearPendingRatings,
  hideContactMeModalAction,
  logOut,
  resetCleanRequest,
  removeClean,
  setAmendRequest,
  setRequestOppParty,
  updateClean,
} from '../../store/reducer/userSlice';
import {logHelper} from '../../utils/logHelper';
import HomeInner from './HomeInner';
import {contactMe} from '../../store/actions/dashboard/contactMe';
import {Pressable, TouchableOpacity, View, AppState} from 'react-native';
import Modal1 from '../../components/Modals/Modal1';

import FuntionButton from '../../components/Buttons/FuntionButton';
import {colors} from '../../config/colors';
import {clean} from '../../store/actions/dashboard/clean';
import {cancelClean} from '../../store/actions/dashboard/cancelClean';
import AmendRequest from './AmendRequest';

import Text from '../../components/Shared/Text';
import AntDesign from '@react-native-vector-icons/ant-design';
import FontAwesome from '@react-native-vector-icons/fontawesome';

import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {useFormik} from 'formik';
import {rateCleaner} from '../../store/actions/dashboard/rateCleaner';
import {tipCleaner} from '../../store/actions/dashboard/tipCleaner';
import {setCleanerslocation} from '../../store/reducer/userSlice';
import {getChat} from '../../store/actions/chats/getChats';
import TipModal from '../../components/Modals/TipModal';
import {Client} from '../../config/client';
import {useTranslation} from 'react-i18next';

const Home = ({navigation}) => {
  const {t} = useTranslation();
  const [token, setToken] = useState(null);

  const dispatch = useDispatch();

  const [showcontactMe, setShowContactMe] = useState(false);
  const [showContactMeMessage, setShowContactMeMessage] = useState(false);
  const [ratings, setRatings] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipHandled, setTipHandled] = useState(false);
  const [fetchedTipAmount, setFetchedTipAmount] = useState(0);
  const [fetchedTipCurrency, setFetchedTipCurrency] = useState('');
  const {shouldShowContactMeModal, cleanCalculateData, pendingRating, pendingTipCleanAmount} =
    useSelector(state => state.user);
  const currency = useSelector(state => state.user.user?.site_country?.currency);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');

          setToken(token);
          if (!token) {
            dispatch(logOut());
          }
        } catch (error) {}
      })();
    }, [dispatch]),
  );
  const {
    user,
    clean: cleanData,
    amendRequest,
  } = useSelector(state => state.user);

  const handleSubmit = (values, {resetForm}) => {
    const payload = {
      id: pendingRating,
      status: 7,
      review_rating: ratings,
      review_comment: values.review_comment,
    };

    dispatch(
      rateCleaner({
        payload,
        cb: () => {
          dispatch(clearPendingRatings());
          setRatings(0);
          resetForm();
        },
      }),
    );
  };

  useEffect(() => {
    if (!pendingRating || tipHandled) return;
    (async () => {
      try {
        const res = await Client({method: 'GET', path: `history/${pendingRating}`});
        const clean = res?.data?.history;
        const amount = Number(clean?.amount ?? clean?.amount_charged ?? 0);
        const cur = clean?.country?.currency ?? currency ?? '';
        setFetchedTipAmount(amount);
        setFetchedTipCurrency(cur);
        if (amount > 0) {
          setShowTipModal(true);
        } else {
          setTipHandled(true);
        }
      } catch {
        setTipHandled(true);
      }
    })();
  }, [pendingRating]);

  useEffect(() => {
    if (!pendingRating) {
      setTipHandled(false);
      setShowTipModal(false);
      setFetchedTipAmount(0);
      setFetchedTipCurrency('');
    }
  }, [pendingRating]);

  const handleTip = async percentage => {
    if (percentage !== null) {
      try {
        await dispatch(
          tipCleaner({cleanId: pendingRating, tipPercentage: percentage}),
        ).unwrap();
      } catch {}
    }
    setShowTipModal(false);
    setTipHandled(true);
  };

  const form = useFormik({
    initialValues: {},
    onSubmit: handleSubmit,
  });

  useFocusEffect(
    useCallback(() => {
      // dispatch(authenticated());
      // dispatch(getChat());
      dispatch(getClean());

      // if (cleanData?.clean_cleaners?.length > 0) {
      //   dispatch(getClean());
      // }
    }, [dispatch]),
  );

  Pusher.logToConsole = true;
  let PusherClient = useMemo(() => {
    if (!token) {
      return null;
    }

    return new Pusher(pusherConfig.key, {
      ...pusherConfig,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
      userAuthentication: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    });
  }, [token]);

  let echo = useMemo(() => {
    if (!PusherClient) {
      return null;
    }

    return new Echo({
      broadcaster: 'pusher',
      client: PusherClient,
    });
  }, [PusherClient]);

  // Guard to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!echo || !user?.id) {
      return () => {
        isMountedRef.current = false;
      };
    }

    echo
      .private(`clean.${user?.id}`)
      .listen('Clean', e => {
        // Prevent state updates if component unmounted
        if (!isMountedRef.current) return;

        // console.log(e, 'ee-----ee');
        const clean = e?.clean;
        // console.log(' C L E A N ===>', clean);

        const cleanUser = e?.user;
        if (cleanUser && cleanUser?.name !== user?.name) {
          // dispatch(setRequestOppParty(cleanUser));
        }
        if (e?.clean?.current_position) {
          // Stamp arrival time so CleanDetails can tell "cleaner is parked" from
          // "cleaner's app went away". Device clock on both ends of the comparison.
          dispatch(setCleanerslocation({...e.clean, at: Date.now()}));
        }

        // if (clean?.clean_amend?.status === 0) {
        //   dispatch(getClean());
        //   // dispatch(setAmendRequest(clean));
        // } else
        if (clean?.status === 10) {
          dispatch(resetCleanRequest(clean));
        } else if (clean === null) {
          dispatch(clearCleanRequest());
        } else if (clean?.current_position && clean?.status == null) {
          // Position-only heartbeat (en-route tracking, ~every 10s): the marker was
          // already updated via setCleanerslocation above — no refetch needed.
        } else {
          dispatch(getClean());
          // dispatch(updateClean(clean));
        }
        // if(!e?.clean){
        //   dispatch(getClean())
        // }

        // if("cleaner has accepted the request"){
        // dispatch(updateClean(e.clean.clean))
        // }
      })
      .error(e => {});
    return () => {
      isMountedRef.current = false;
      if (echo) {
        echo.leaveAllChannels();
      }
    };
  }, [user, echo, dispatch]);

  // Listen to chat messages to update messageCount
  useEffect(() => {
    if (!echo || !cleanData?.id || !user?.id) {
      return;
    }

    let syncTimer;
    const chatChannel = echo.join(`chat.${cleanData.id}`);

    chatChannel.listen('.chat.message', ({message, user: sender}) => {
      if (sender?.id !== user?.id) {
        if (syncTimer) {
          clearTimeout(syncTimer);
        }
        syncTimer = setTimeout(() => {
          dispatch(getClean());
        }, 350);
      }
    });

    return () => {
      if (syncTimer) {
        clearTimeout(syncTimer);
      }
      echo.leave(`chat.${cleanData.id}`);
    };
  }, [cleanData?.id, user?.id, echo, dispatch]);

  // Reconnect Pusher when app returns to foreground
  useEffect(() => {
    if (!PusherClient) {
      return;
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Reconnect Pusher if disconnected
        if (PusherClient.connection.state !== 'connected') {
          console.log('Reconnecting Pusher...');
          PusherClient.connect();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [PusherClient]);

  useEffect(() => {
    if (shouldShowContactMeModal === true && cleanData?.status === 8) {
      dispatch(hideContactMeModalAction());
      setShowContactMe(true);
    } else if (shouldShowContactMeModal === false) {
      setShowContactMe(false);
    }
  }, [shouldShowContactMeModal, cleanData?.status, dispatch]);

  const handleContactMe = () => {
    setShowContactMeMessage(false); // Close immediately for instant feedback
    dispatch(
      contactMe({
        payload: {
          task_type_id: 5,
          reason: 'failed_matching',
          clean_id: cleanData?.id,
        },
        callBack: () => {
          // Modal already closed, callback is now just for any post-success logic
        },
      }),
    );
  };

  const handleCancel = () => {
    const payload = {
      id: cleanData?.id,
      status: 5,
      review_rating: 1,
    };
    dispatch(cancelClean({payload, navigation}));
    setShowContactMe(false);
  };
  const handleClose = () => {
    setShowContactMe(false);
  };

  const handleTryAgain = () => {
    const data = {...cleanCalculateData, amount: cleanData?.amount};
    dispatch(
      clean({
        data,
        navigation,
        callBack: () => {
          if (showcontactMe) {
            setShowContactMe(false);
          }
        },
      }),
    );
  };

  return (
    <>
      {/* {amendRequest?.status ? ( */}
      {cleanData &&
      cleanData?.status !== 10 &&
      cleanData?.clean_amend?.status === 0 ? (
        <AmendRequest />
      ) : cleanData && cleanData?.status !== 10 ? (
        <CleanDetails />
      ) : (
        <HomeInner />
      )}

      {/* {showcontactMe && (
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
              height: 'auto',
              paddingVertical: 0,

              height: 320,
            }}
            setShowModal={handleClose}>
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
                  onPress={() => {
                    setShowContactMeMessage(true);
                  }}
                  name={t('cleanDetails.contact_me')}
                />
                <FuntionButton
                  style={{width: '100%', backgroundColor: colors.orangeDark}}
                  onPress={handleCancel}
                  name={t('cleanDetails.cancel_button')}
                />
              </View>
            </View>
          </Modal1>
        </View>
      )} */}
      {showContactMeMessage && (
        <Pressable
          onPress={() => setShowContactMeMessage(false)}
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
              paddingVertical: 4,

              height: 270,
              alignItems: 'center',
            }}
            setShowModal={setShowContactMeMessage}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'space-evenly',
                width: '85%',
                flex: 1,
                paddingTop: 8,
              }}>
              <Text
                style={{fontSize: 18, color: '#252525'}}
                fontType={'roboto'}
                center>
                {t('contactMe.thank_you_title')}
              </Text>
              <Text
                style={{fontSize: 16, color: '#252525'}}
                fontType={'roboto'}
                center>
                {t('contactMe.request_sent_body')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}>
                <FuntionButton
                  style={{
                    alignSelf: 'center',
                    width: '100%',
                    marginBottom: 0,
                  }}
                  onPress={handleContactMe}
                  name={t('common.ok')}
                />
              </View>
            </View>
          </Modal1>
        </Pressable>
      )}
      {showTipModal && pendingRating && (
        <TipModal
          cleanId={pendingRating}
          cleanAmount={fetchedTipAmount}
          currency={fetchedTipCurrency || currency || 'CAD $'}
          onDone={handleTip}
        />
      )}
      {pendingRating && !showTipModal && (
        <Pressable
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
              height: 'auto',
              justifyContent: 'space-evenly',
              // height: 300,
              alignItems: 'center',
            }}
            setShowModal={() => {}}>
            <View
              style={{
                backgroundColor: '#F5F5F6',
                width: '100%',
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 20,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
              }}>
              <TouchableOpacity
                onPress={() => dispatch(clearPendingRatings())}
                style={{alignSelf: 'flex-end', padding: 4}}>
                <AntDesign name="close" size={20} color={'#888'} />
              </TouchableOpacity>
              <Text medium fontType={'roboto'} style={{fontSize: 16}}>{t('rate.review_rating_label')}</Text>
              <Text bold fontType={'roboto'} style={{fontSize: 36}}>
                {ratings}.0
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {[1, 2, 3, 4, 5].map(index => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setRatings(index)}>
                    <FontAwesome
                      fill={'red'}
                      style={{color: '#F8C22E'}}
                      name={index <= ratings ? 'star' : 'star-o'}
                      size={32}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text fontType={'roboto'} style={{fontSize: 16, marginTop: 16}}>{t('rate.give_rating_prompt')}</Text>

              <TextInputField
                custom
                placeholder={t('rate.add_review_placeholder')}
                style={{borderColor: '#000'}}
                {...formHandler('review_comment', form)}
                label={t('rate.review_comments_label')}
                type="text-area"
                mainStyles={{width: '100%'}}
                //disabled={!ratings}
              />

              <Button
                text={t('editBooking.submit')}
                disabled={!ratings}
                pressed={form.handleSubmit}
                height={52}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  marginVertical: 16,
                }}
              />
            </View>
          </Modal1>
        </Pressable>
      )}
    </>
  );
};

export default Home;
