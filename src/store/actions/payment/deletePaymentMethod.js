import {createAsyncThunk} from '@reduxjs/toolkit';
import {DELETE_PAYMENTMETHOD, PAYMENTMETHODS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logHelper} from '../../../utils/logHelper';

export const deletePaymentMethod = createAsyncThunk(
  'user/deletePaymentMethod',
  async ({id, cb}) => {
    try {
      const {
        data: {payment},
      } = await Client({
        method: 'POST',
        path: DELETE_PAYMENTMETHOD,
        data: {
          payment_method_id: id,
        },
      });
      cb();

      return payment;
    } catch (error) {
      cb();
      throw error;
    }
  },
);
