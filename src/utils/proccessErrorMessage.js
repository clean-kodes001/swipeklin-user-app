import {logHelper} from './logHelper';
import {showToast} from './showToast';

export const proccessErrorMessage = async (e, category) => {
  // logHelper(e?.message, 'Error From Proceess Error1');
  // logHelper(e?.response?.data, 'Error From Proceess Error2');
  // logHelper(e?.response?.data?.data, 'Error From Proceess Error3');
  // logHelper(
  //   e?.response?.data?.data?.data?.status,
  //   'Error From Proceess Error4',
  // );
  // logHelper(
  //   e?.response?.data?.data?.data?.next_action,
  //   'next_actionError From Proceess Error',
  // );
console.log('error from  process error', e);
  let message;
  switch (e?.response?.data?.message || e?.message || e) {
    case 'Internal Server Error':
      message = 'Error, Please try again later.';
      break;
    case 'Server Error':
      message = 'Error, Please try again later.';
      break;
    case 'Unauthenticated.':
      message = 'Session expired. Please login again';
      break;
    case 'Network Error':
      message = 'Check Your Internet Connection';
      break;
    case 'Clean could not be found!':
      message = 'Your cleaning request has been canceled!';
      break;
    default:
      // Get the raw message
      let rawMessage =
        e?.response?.data?.message ||
        e?.message ||
        e ||
        'An error has occured!';
      
      // If there are specific field errors, use the first one instead
      const errors = e?.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey && Array.isArray(errors[firstErrorKey])) {
          rawMessage = errors[firstErrorKey][0];
        }
      }
      
      // Clean up "(and X more error)" or "(and X more errors)" suffixes
      message = String(rawMessage).replace(/\s*\(and \d+ more errors?\)/gi, '');
      break;
  }

  showToast({
    type: message === 'Your clean has automatically ended!' ? 2 : 0,
    title: category,
    message,
  });
};
