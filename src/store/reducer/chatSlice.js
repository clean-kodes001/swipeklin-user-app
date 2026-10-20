import {createSlice} from '@reduxjs/toolkit';
import {postChat} from '../actions/chats/postChat';
import {getChat} from '../actions/chats/getChats';

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    loading: false,
    error: null,
    pending: false,
    success: false,
    chats: [],
    lastMessageStatus: null,
  },

  reducers: {
    clearRoom: (state, action) => {
      state.chats = [];
    },
  },
  extraReducers: builder => {
    builder.addCase(postChat.rejected, (state, action) => {
      state.lastMessageStatus = 'failed';
      state.pending = false;
    });

    builder.addCase(postChat.pending, (state, action) => {
      state.lastMessageStatus = 'sending';
      state.pending = true;
      state.error = null;
    });
    builder.addCase(postChat.fulfilled, (state, action) => {
      state.lastMessageStatus = 'success';
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(getChat.rejected, (state, action) => {
      state.error = true;
      state.pending = false;
    });

    builder.addCase(getChat.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(getChat.fulfilled, (state, action) => {
      state.chats = action.payload;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
  },
});

export const {clearRoom} = chatSlice.actions;
export default chatSlice.reducer;
