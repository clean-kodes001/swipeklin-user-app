import {createAsyncThunk} from '@reduxjs/toolkit';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const uploadImage = createAsyncThunk(
  'user/uploadImage',
  async payload => {
    const {navigation, data, nextStage, nextPage} = payload;
    try {
      navigation.navigate('step3', {avatar: data?.avatar});
      return {
        nextStage: 3,
        avatar: data?.localAvatar || null,
      };
    } catch (error) {
      // proccessErrorMessage(error);
      throw error;
    }
  },
);
