import {createAsyncThunk} from '@reduxjs/toolkit';
import {AMEND_CLEAN} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import i18n from '../../../i18n/i18n';

export const acceptAmend = createAsyncThunk(
  'user/acceptAmend',
  async ({payload, callBack}) => {
    try {
      const {data} = await Client({
        method: 'POST',
        path: AMEND_CLEAN,
        data: payload,
      });

      processSuccessMessage(i18n.t('toasts.amend_accepted'));
      callBack();
      return data?.clean;
    } catch (error) {
      throw error;
    }
  },
);
