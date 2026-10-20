import {createAsyncThunk} from '@reduxjs/toolkit';
import {REQUEST_CLEANER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logHelper} from '../../../utils/logHelper';

export const clean = createAsyncThunk('user/clean', async payload => {
  const {data, navigation, callBack} = payload;

  try {
    const {data: returnedData} = await Client({
      method: 'POST',
      path: REQUEST_CLEANER,
      data: data,
    });

    if (returnedData?.payment?.status === 'pending') {
      callBack(returnedData);
    } else {
      const clean = returnedData?.clean;

      if (clean?.payment.message) {
        // processSuccessMessage(clean?.payment.message);
      }
      callBack(clean);
    }

    return returnedData?.clean;
  } catch (error) {
    if (error?.response?.data?.message === 'Please add card to continue') {
      navigation.navigate('paymentmethod');
    }

    throw error;
  }
});
