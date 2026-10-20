import {createAsyncThunk} from '@reduxjs/toolkit';
import {CONTACT_US} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const contactUs = createAsyncThunk(
  'user/contactUs',
  async ({payload, callBack}, {rejectWithValue}) => {
    try {
      const response = await Client({
        method: 'POST',
        path: CONTACT_US,
        data: {
          payload: {
            message_title: payload.message_title?.trim(),
            message: payload.message?.trim(),
          },
        },
      });

      processSuccessMessage(
        response?.message || 'Your message has been sent successfully!',
      );
      callBack();
      return response.data || response;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})
          .flat()
          .join(', ') ||
        error?.message ||
        'Failed to send message';
      proccessErrorMessage(errorMessage);
      return rejectWithValue(error?.response?.data || errorMessage);
    }
  },
);
