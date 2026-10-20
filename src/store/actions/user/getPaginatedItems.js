import {createAsyncThunk} from '@reduxjs/toolkit';
import {Client} from '../../../config/client';
import {logHelper} from '../../../utils/logHelper';

export const getPaginatedItems = createAsyncThunk(
  'user/getPaginatedItems',
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
