import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROFILE} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const completeProfile = createAsyncThunk(
  'user/completeProfile',
  async payload => {
    const {navigation, data, nextStage} = payload;
    try {
      const {
        data: {user},
      } = await Client({
        method: 'POST',
        path: PROFILE,
        data: data,
      });

      return {
        nextStage,
        user,
      };
    } catch (error) {
      // proccessErrorMessage(error);
      throw error;
    }
  },
);
