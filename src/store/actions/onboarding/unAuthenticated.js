import {createAsyncThunk} from '@reduxjs/toolkit';
import {UNAUTHENTICATED} from '../../../config/apis';
import {Client} from '../../../config/client';

export const unAuthenticated = createAsyncThunk(
  'user/unAuthenticated',
  async callBack => {
    try {
      const response = await Client({
        method: 'GET',
        path: UNAUTHENTICATED,
      });
      callBack();
      return response.data;
    } catch (error) {
      callBack();
      throw error;
    }
  },
);
