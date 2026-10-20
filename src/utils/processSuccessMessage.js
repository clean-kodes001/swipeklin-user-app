import {showToast} from './showToast';

export const processSuccessMessage = (message, info) => {
  showToast({type: info ? 1 : 2, message});
};
