import {createAsyncThunk} from '@reduxjs/toolkit';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const goToImageStep = createAsyncThunk(
  'user/goToImage',
  async payload => {
    const {navigation} = payload;
    try {
      navigation.navigate('step2');
      return {
        nextStage: 2,
      };
    } catch (error) {
      // proccessErrorMessage(error);
      throw error;
    }
  },
);
