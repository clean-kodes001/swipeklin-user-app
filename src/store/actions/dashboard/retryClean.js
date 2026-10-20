import {createAsyncThunk} from '@reduxjs/toolkit';
import {REQUEST_CLEANER} from '../../../config/apis';
import {Client} from '../../../config/client';

export const retryClean = createAsyncThunk('user/retryClean', async payload => {
  const {cleanId, navigation, callBack} = payload;

  try {
    const {data: returnedData} = await Client({
      method: 'POST',
      path: `${REQUEST_CLEANER}/${cleanId}/retry`,
      data: {},
    });

    if (returnedData?.payment?.status === 'pending') {
      callBack(returnedData);
    } else {
      const clean = returnedData?.clean;

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
