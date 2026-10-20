import {createAsyncThunk} from '@reduxjs/toolkit';
import {PAYMENTMETHODS_SETUP} from '../../../config/apis';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const getPaymentSheetSetup = createAsyncThunk(
  'payment/getPaymentSheetSetup',
  async () => {
    try {
      const {
        data: {customer, ephemeral_key, setup_intent, publishableKey},
      } = await Client({
        method: 'GET',
        path: PAYMENTMETHODS_SETUP,
      });

      return {
        customer,
        ephemeral_key,
        setup_intent,
        publishableKey,
      };
    } catch (error) {
      const msg = proccessErrorMessage(error);
      throw new Error(msg);
    }
  },
);

