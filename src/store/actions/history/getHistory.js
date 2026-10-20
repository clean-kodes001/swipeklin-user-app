import {createAsyncThunk} from '@reduxjs/toolkit';
import {COUNTRY, HISTORY} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logHelper} from '../../../utils/logHelper';

export const getHistory = createAsyncThunk('user/getHistory', async () => {
  try {
    const {
      data: {histories},
    } = await Client({
      method: 'GET',
      path: HISTORY,
    });

    return histories;
  } catch (error) {
    throw error;
  }
});
