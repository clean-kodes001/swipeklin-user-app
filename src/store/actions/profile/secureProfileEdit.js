import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROFILE} from '../../../config/apis';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import i18n from '../../../i18n/i18n';

export const secureProfileEdit = createAsyncThunk(
  'user/secureProfileEdit',
  async payload => {
    const {data, navigation, resending} = payload;
    try {
      const {
        data: {user},
      } = await Client({
        method: 'POST',
        path: PROFILE,
        data: data,
        contentType: 'multipart/form-data',
      });
      if (!resending) {
        processSuccessMessage(i18n.t('toasts.profile_updated'));
        navigation.goBack();
        return user;
      }
    } catch (error) {
      throw error;
    }
  },
);
