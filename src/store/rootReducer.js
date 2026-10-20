import {combineReducers} from '@reduxjs/toolkit';
import ui from './reducer/uiSlice';
import user from './reducer/userSlice';
import profile from './reducer/profileSlice';
import data from './reducer/dataSlice';
import chat from './reducer/chatSlice';
import history from './reducer/historySlice';
import payment from './reducer/paymentSlice';
import bookings from './reducer/bookingsSlice';
import notification from './reducer/notificationSlice';

export const rootReducer = combineReducers({
  ui,
  user,
  profile,
  data,
  chat,
  history,
  bookings,
  notification,
  payment,
});
