import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROFILE} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import i18n from '../../../i18n/i18n';

export const uploadProfile = createAsyncThunk(
  'user/uploadProfile',
  async payload => {
    const {data} = payload;
    try {
      const {data: _data} = await Client({
        method: 'POST',
        path: PROFILE,
        data: data,
        contentType: 'multipart/form-data',
      });
      
      processSuccessMessage(i18n.t('toasts.profile_updated'));
      return {
        nextStage: 3,
        user: _data.user,
      };
    } catch (error) {
      throw error;
    }
  },
);
