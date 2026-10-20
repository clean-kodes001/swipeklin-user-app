import React, {useCallback, useEffect, useState} from 'react';
import {initI18n} from './src/i18n/i18n';
import {Routes} from './src/config/routes';
import UpdateGate from './src/components/Shared/UpdateGate';
import Toast from 'react-native-toast-message';
import {Provider, useDispatch, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './src/store/store';
import Loading from './src/components/Shared/Loading';
import SplashScreen from 'react-native-splash-screen';
import {unAuthenticated} from './src/store/actions/onboarding/unAuthenticated';
import {logOut, setPendingRatingFromNotification} from './src/store/reducer/userSlice';
import {getClean} from './src/store/actions/dashboard/getClean';
import {Client} from './src/config/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState, Text, View} from 'react-native';
import {setNotify} from './src/store/reducer/notificationSlice';
import {LogLevel, OneSignal} from 'react-native-onesignal';
import {BaseToast, ErrorToast, InfoToast} from 'react-native-toast-message';
import Geolocation from '@react-native-community/geolocation';
import {SafeAreaProvider} from 'react-native-safe-area-context';

if (typeof navigator !== 'undefined' && !navigator.geolocation) {
  navigator.geolocation = Geolocation;
}

const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      text2NumberOfLines={3}
      contentContainerStyle={{
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
      style={{
        borderLeftColor: '#198754',
        height: '100%',
        width: '90%',
      }}
      onPress={() => Toast.hide()}
    />
  ),

  error: props => (
    <ErrorToast
      {...props}
      text2NumberOfLines={3}
      contentContainerStyle={{
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
      style={{
        borderLeftColor: '#dc3545',
        height: '100%',
        width: '90%',
      }}
      onPress={() => Toast.hide()}
    />
  ),

  info: props => (
    <InfoToast
      {...props}
      text2NumberOfLines={3}
      contentContainerStyle={{
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
      style={{
        borderLeftColor: '#0dcaf0',
        height: '100%',
        width: '90%',
      }}
      onPress={() => Toast.hide()}
    />
  ),
};

const Pages = () => {
  const dispatch = useDispatch();
  const {pending, error, user} = useSelector(state => state.user);
  const {pending: uiPending} = useSelector(state => state.ui);
  const {error: dataPending} = useSelector(state => state.data);

  const {pending: pendingProfile} = useSelector(state => state.profile);
  const {notify} = useSelector(state => state.notification);
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');

        if (!token) {
          dispatch(logOut());
        }
      } catch (error) {}
    })();
  }, [dispatch, error, dataPending, pendingProfile]);

  useEffect(() => {
    dispatch(
      unAuthenticated(() => {
        SplashScreen.hide();
      }),
    );

    // Remove this method to stop OneSignal Debugging
    // OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    // OneSignal.Debug.setAlertLevel(LogLevel.Verbose);

    // OneSignal Initialization
    OneSignal.initialize('303c52a7-5ef3-463d-9567-8eef348f7dab');

    // requestPermission will show the native iOS or Android notification permission prompt.
    // We recommend removing the following code and instead using an In-App Message to prompt for notification permission
    OneSignal.Notifications.requestPermission(true);
    // requestPermission Triggering Programmatically

    // Method for listening for notification clicks
    OneSignal.Notifications.addEventListener('click', event => {
      console.log('OneSignal: notification clicked:', event);
      // Refresh data when notification is clicked
      dispatch(getClean());

      // "Cleaning ended" pushes carry the clean id in additionalData. If the app
      // was closed when the live Pusher event fired, getClean() alone can't
      // recover the tip/rate prompt (GET /clean excludes completed cleans) — so
      // fetch that specific clean's history and, if it hasn't been reviewed yet,
      // set pendingRating directly. Home.jsx's existing tip/rate UI then renders
      // exactly as it would from the live-event path.
      (async () => {
        try {
          const data = event?.notification?.additionalData;
          if (data?.type !== 'cleaning_ended' || !data?.clean_id) return;

          const res = await Client({
            method: 'GET',
            path: `history/${data.clean_id}`,
          });
          const history = res?.data?.history;
          if (history && !history.review) {
            dispatch(setPendingRatingFromNotification(data.clean_id));
          }
        } catch (error) {
          console.error(
            'OneSignal: error handling cleaning_ended notification click:',
            error,
          );
        }
      })();
    });
  }, [dispatch]);

  const [appState, setAppState] = useState(AppState.currentState);
  const [isMounted, setIsMounted] = useState(true);

  const handleAppStateChange = useCallback(
    nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        setIsMounted(true);
        console.log('active');

        // Refresh clean data when app returns to foreground
        if (user?.id) {
          dispatch(getClean());
        }
      } else if (
        appState === 'active' &&
        nextAppState.match(/inactive|background/) &&
        !notify &&
        user?.profile
      ) {
        setIsMounted(false);
        dispatch(setNotify());
      }
      setAppState(nextAppState);
    },
    [appState, dispatch, notify, user],
  );

  useEffect(() => {
    const Sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      Sub.remove();
    };
  }, [handleAppStateChange]);

  return (
    <>
      <Routes />
      <UpdateGate />
      {(pending || pendingProfile || uiPending) && <Loading />}
    </>
  );
};

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
    const timeOut = setTimeout(() => {
      SplashScreen.hide();
    }, 3000);

    return () => clearTimeout(timeOut);
  }, []);

  if (!i18nReady) return null;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <Pages />
          <Toast config={toastConfig} />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
