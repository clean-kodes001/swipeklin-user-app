import {createAsyncThunk} from '@reduxjs/toolkit';
import {CHAT} from '../../../config/apis';
import {Client} from '../../../config/client';

export const getChat = createAsyncThunk('user/getChat', async () => {
  try {
    const {
      data: {clean},
    } = await Client({
      method: 'GET',
      path: CHAT,
    });

    return clean?.chats?.reverse();
  } catch (error) {
    throw error;
  }
});
