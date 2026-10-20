import {createAsyncThunk} from '@reduxjs/toolkit';
import {AUTHENTICATED} from '../../../config/apis';
import {Client} from '../../../config/client';

export const authenticated = createAsyncThunk(
  'user/authenticated',
  async payload => {
    try {
      const response = await Client({
        method: 'GET',
        path: AUTHENTICATED,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
);
