import {createAsyncThunk} from '@reduxjs/toolkit';
import {REQUEST_CLEANER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {getClean} from './getClean';
import i18n from '../../../i18n/i18n';

export const cancelClean = createAsyncThunk(
  'user/cancelClean',
  async ({payload, navigation}, {dispatch}) => {
    try {
      const response = await Client({
        method: 'PUT',
        path: `${REQUEST_CLEANER}/${payload.id}`,
        data: payload,
      });

      // Check if server indicates a refresh is needed (e.g., expired clean)
      if (response?.data?.requires_refresh) {
        processSuccessMessage(response?.data?.message || 'Request expired.');
        dispatch(getClean()); // Refresh clean data
        navigation.navigate('dashboard');
        return response?.data || {};
      }

      processSuccessMessage(i18n.t('toasts.clean_canceled'));
      navigation.navigate('dashboard');
      return response?.data || {};
    } catch (error) {
      if (
        error?.response?.data?.message === 'Clean could not be found!' ||
        error?.message === 'Clean could not be found!' ||
        error === 'Clean could not be found!'
      ) {
        dispatch(getClean());
      }
      throw error;
    }
  },
);