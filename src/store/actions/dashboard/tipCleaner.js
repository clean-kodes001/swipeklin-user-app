import {createAsyncThunk} from '@reduxjs/toolkit';
import {Client} from '../../../config/client';

export const tipCleaner = createAsyncThunk(
  'user/tipCleaner',
  async ({cleanId, tipPercentage}) => {
    await Client({
      method: 'POST',
      path: `clean/${cleanId}/tip`,
      data: {tip_percentage: tipPercentage},
    });
    return {};
  },
);
