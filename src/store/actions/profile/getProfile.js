import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROFILE} from '../../../config/apis';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

export const getProfile = createAsyncThunk('user/getProfile', async payload => {
  try {
    const {
      data: {user},
    } = await Client({
      method: 'GET',
      path: PROFILE,
    });
    return user;
  } catch (error) {
    throw error;
  }
});
