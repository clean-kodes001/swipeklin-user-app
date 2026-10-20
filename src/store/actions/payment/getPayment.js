import {createAsyncThunk} from '@reduxjs/toolkit';
import {COUNTRY, HISTORY, PAYMENT} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logHelper} from '../../../utils/logHelper';

export const getPayment = createAsyncThunk('user/getPayment', async () => {
  try {
    const {
      data: {payments},
    } = await Client({
      method: 'GET',
      path: PAYMENT,
    });
    return payments;
  } catch (error) {
    throw error;
  }
});
