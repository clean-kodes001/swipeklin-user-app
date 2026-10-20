import {createAsyncThunk} from '@reduxjs/toolkit';
import {REQUEST_CLEANER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {logHelper} from '../../../utils/logHelper';

export const getClean = createAsyncThunk('user/getClean', async payload => {
  try {
    const response = await Client({
      method: 'GET',
      path: REQUEST_CLEANER,
    });
    // console.log('getClean data===>', data);
    const {unread_chat_count, clean} = response.data;
    const server_time = response.headers?.date;

    return {unread_chat_count, clean, server_time};
  } catch (error) {
    throw error;
  }
});
