import {createAsyncThunk} from '@reduxjs/toolkit';
import {REQUEST_CLEANER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import i18n from '../../../i18n/i18n';

export const rateCleaner = createAsyncThunk(
  'user/rateCleaner',
  async ({payload, cb}) => {
    try {
      const data = await Client({
        method: 'PUT',
        path: `${REQUEST_CLEANER}/${payload.id}`,
        data: payload,
      });

      processSuccessMessage(i18n.t('toasts.rated_cleaner'));
      cb();
      return {};
    } catch (error) {
      throw error;
    }
  },
);
