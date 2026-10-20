import {createAsyncThunk} from '@reduxjs/toolkit';
import {FORGOTPASSWORD, REGISTER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const forgotPassword = createAsyncThunk(
  'user/forgotpassword',
  async payload => {
    const {navigation, data} = payload;
    try {
      const {data: _data} = await Client({
        method: 'POST',
        path: FORGOTPASSWORD,
        data: data,
      });

      if (_data?.message === 'Password reset was successful!') {
        processSuccessMessage(_data?.message);
        navigation.navigate('login');
      } else {
        processSuccessMessage(_data?.message);
        navigation.navigate('forgotpasswordotp', {data});
        return null;
      }
    } catch (error) {
      // proccessErrorMessage(error);
      throw error;
    }
  },
);
