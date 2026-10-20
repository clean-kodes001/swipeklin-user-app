import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROFILE} from '../../../config/apis';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {getProfile} from './getProfile';
import i18n from '../../../i18n/i18n';

export const uploadUserProfile = createAsyncThunk(
  'user/uploadUserProfile',
  async (payload, {dispatch}) => {
    const {data, navigation, secureUpdate, securedData} = payload;
    try {
      const {
        data: {user},
      } = await Client({
        method: 'POST',
        path: PROFILE,
        data: data,
        contentType: 'multipart/form-data',
      });
      if (secureUpdate) {
        navigation.navigate('editprofileotp', {data: securedData});
      } else {
        processSuccessMessage(i18n.t('toasts.profile_updated'));
        // Refresh profile to get updated avatar immediately
        dispatch(getProfile());
        navigation.goBack();
        return user;
      }
    } catch (error) {
      console.log('uploadUserProfile error===>', error);
      throw error;
    }
  },
);
