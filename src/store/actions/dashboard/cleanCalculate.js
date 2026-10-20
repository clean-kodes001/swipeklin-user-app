import {createAsyncThunk} from '@reduxjs/toolkit';
import {CALCULATE_PRICE} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logOut} from '../../reducer/userSlice';

export const cleanCalculate = createAsyncThunk(
  'user/requestCleaner',
  async ({data: payload, navigation}) => {
    try {
      const {
        data: {clean},
      } = await Client({
        method: 'POST',
        path: CALCULATE_PRICE,
        data: payload,
      });
      navigation.navigate('successmessage', {
        type: 'cleanCalculate',
        data: clean,
      });
      return payload;
    } catch (error) {
      throw error;
    }
  },
);
