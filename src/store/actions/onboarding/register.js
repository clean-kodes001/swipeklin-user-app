import {createAsyncThunk} from '@reduxjs/toolkit';
import {REGISTER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const register = createAsyncThunk('user/register', async payload => {
  const {navigation, data} = payload;
  try {
    const {data: _data} = await Client({
      method: 'POST',
      path: REGISTER,
      data: data,
    });

    if (_data?.token && _data?.user) {
      await AsyncStorage.setItem('accessToken', _data.token);
      return _data.user;
    } else {
      processSuccessMessage(_data?.message);
      navigation.navigate('signupotp', {data, registered: _data.registered});
      return null;
    }
  } catch (error) {
    // proccessErrorMessage(error);
    throw error;
  }
});
