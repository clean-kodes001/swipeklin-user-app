import {createAsyncThunk} from '@reduxjs/toolkit';
import {LOGIN} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';


export const login = createAsyncThunk('user/login', async payload => {
  const {data} = payload;
  try {
    const {data: _data} = await Client({
      method: 'POST',
      path: LOGIN,
      data: data,
    });

    await AsyncStorage.setItem('accessToken', _data.token);

    return _data.user;
  } catch (error) {
    // console.log(error);
    throw error;
  }
});
