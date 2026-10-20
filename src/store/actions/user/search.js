import {createAsyncThunk} from '@reduxjs/toolkit';
import {Client} from '../../../config/client';

export const search = createAsyncThunk(
  'user/search',
  async ({path, callBack}) => {
    try {
      const {data} = await Client({
        method: 'GET',
        fullPath: path,
      });
      callBack(data);
      return {};
    } catch (error) {
      throw error;
    }
  },
);
