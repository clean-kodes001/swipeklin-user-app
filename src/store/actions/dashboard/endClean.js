import {createAsyncThunk} from '@reduxjs/toolkit';
import {REQUEST_CLEANER} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import i18n from '../../../i18n/i18n';

export const endClean = createAsyncThunk(
  'user/endClean',
  async ({payload, navigation}) => {
    try {
      const data = await Client({
        method: 'PUT',
        path: `${REQUEST_CLEANER}/${payload.id}`,
        data: payload,
      });
      processSuccessMessage(i18n.t('toasts.clean_completed'));
      // navigation.navigate('rate', {
      //   id: payload?.id,
      //   status: 7,
      // });

      return {};
    } catch (error) {
      throw error;
    }
  },
);
