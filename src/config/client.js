import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Axios from 'axios';
import {Platform} from 'react-native';
import {proccessErrorMessage} from '../utils/proccessErrorMessage';
import {OneSignal} from 'react-native-onesignal';

// export const baseURL = 'https://swipeklin.com/api/app/';
export const baseURL = 'https://dev.swipeklin.com/api/app/';
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works fine
const localhost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
// export const baseURL = `http://${localhost}:8000/api/app/`;

const withTimeout = (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error('Request timed out');
      error.code = 'ETIMEDOUT';
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
};

export const Client = async params => {
  const token = await AsyncStorage.getItem('accessToken');
  // console.log('token ===> ', token);

  // Preferred app language (kept in sync with i18n LANGUAGE_KEY = 'app_language').
  // Sent on every request so the backend localises responses/push/email to match.
  const language = (await AsyncStorage.getItem('app_language')) || 'en';

  let subscriptionID = null;
  try {
    subscriptionID = await withTimeout(
      OneSignal.User.pushSubscription.getIdAsync(),
      1500,
    );
  } catch (e) {
    subscriptionID = null;
  }
  // console.log('subscriptionID ===> ', subscriptionID);

  const {
    path,
    fullPath,
    method,
    data,
    contentType = 'application/json',
  } = params;

  const hexEncrypt = text => {
    const key = Math.random().toString(36).substring(2, 15);
    const keyHex = key
      .split('')
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    const textHex = text
      .split('')
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    const combinedHex =
      keyHex.length.toString(16).padStart(2, '0') + keyHex + textHex;
    return combinedHex;
  };
  // const hexDecrypt = combinedHex => {
  //   const keyHexLength = parseInt(combinedHex.slice(0, 2), 16);
  //   const keyHex = combinedHex.slice(2, 2 + keyHexLength);
  //   const textHex = combinedHex.slice(2 + keyHexLength);
  //   const hexToStr = hex =>
  //     hex
  //       .match(/.{1,2}/g)
  //       .map(byte => String.fromCharCode(parseInt(byte, 16)))
  //       .join('');
  //   return hexToStr(textHex);
  // };
  var apiKey = hexEncrypt(
    `${Math.floor(
      new Date().getTime() / 1000,
    )}|${'YlT701BnG2cU3zQ3JomxMXKbijh3HyqJuracIWGRjGTohDLR6o=='}`,
  );
  // console.log('apiKey', hexDecrypt(apiKey));

  const headers = {
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),

    Accept: 'application/json',
    'Accept-Charset': 'utf-8',
    ApiKey: apiKey,
    ApiVersion: '1.0.0',
    // Real installed version (drives the server-side update gate);
    // the backend validates the format, not a pinned value.
    AppVersion: DeviceInfo.getVersion(),
    AppPlatform: Platform.OS,
    AppName: 'SwipeKlinUser',
    AppSubscription: subscriptionID,
    'X-App-Language': language,
    'Content-Type': `${contentType}`,
  };

  let url = fullPath || `${baseURL}${path}`;

  const requestBody = {
    method,
    url,
    headers,
    data: !(contentType === 'multipart/form-data')
      ? JSON.stringify(data)
      : data,
    responseType: 'json',
    timeout: 30000,
  };
  // logHelper(requestBody, 'requestBody');

  try {
    const response = await Axios(requestBody);
    // console.log('response', response.data);

    return response;
  } catch (error) {
    // console.log('error', error);

    try {
      if (
        error?.response?.data?.message === 'Unauthenticated.' ||
        error?.message === 'Unauthenticated.' ||
        error === 'Unauthenticated.'
      ) {
        AsyncStorage.removeItem('accessToken');
      }
      if (params?.processError === false) {
        throw error;
      } else {
        proccessErrorMessage(error);
        throw error;
      }
    } catch (error2) {
      throw error2;
    }
  }
};
