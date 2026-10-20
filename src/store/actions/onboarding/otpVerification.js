import {createAsyncThunk} from '@reduxjs/toolkit';
import {REGISTER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const otpVerification = createAsyncThunk(
  'user/otpVerification',
  async payload => {
    const {navigation, data} = payload;
    try {
      const {data: _data} = await Client({
        method: 'POST',
        path: REGISTER,
        data: data,
      });

      if (data.registered) {
        navigation.navigate('enterpassword', {data});
      } else {
        navigation.navigate('createpassword', {data});
      }
    } catch (error) {
      // proccessErrorMessage(error);
      throw error;
    }
  },
);
