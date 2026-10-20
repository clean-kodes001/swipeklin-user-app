import {createAsyncThunk} from '@reduxjs/toolkit';
import {FORGOTPASSWORD} from '../../../config/apis';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const forgotPasswordOtpVerification = createAsyncThunk(
  'user/forgotPasswordOtpVerification',
  async payload => {
    const {navigation, data} = payload;
    try {
      const {data: _data} = await Client({
        method: 'POST',
        path: FORGOTPASSWORD,
        data: data,
      });
      navigation.navigate('resetpassword', {data});
    } catch (error) {
      // proccessErrorMessage(error);
      throw error;
    }
  },
);
