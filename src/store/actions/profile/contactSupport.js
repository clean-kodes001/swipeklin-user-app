import {createAsyncThunk} from '@reduxjs/toolkit';
import {CONTACT} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

export const contactSupport = createAsyncThunk(
  'user/contactSupport',
  async ({payload, callBack}) => {
    console.log('payload===>', payload);
    try {
      await Client({
        method: 'POST',
        path: CONTACT,
        data: payload,
        contentType: 'multipart/form-data',
      });
      processSuccessMessage(
        'Your request has been recieved and we will get back to you!',
      );
      callBack();
    } catch (error) {
      throw error;
    }
  },
);
