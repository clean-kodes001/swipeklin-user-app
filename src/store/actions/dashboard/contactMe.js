import {createAsyncThunk} from '@reduxjs/toolkit';
import {CONTACT} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import i18n from '../../../i18n/i18n';

export const contactMe = createAsyncThunk(
  'user/contactMe',
  async ({payload, callBack}) => {
    try {
      const res = await Client({
        method: 'POST',
        path: CONTACT,
        data: payload,
      });

      callBack();
      processSuccessMessage(i18n.t('toasts.request_sent'));
      return {};
    } catch (error) {
      throw error;
    }
  },
);
