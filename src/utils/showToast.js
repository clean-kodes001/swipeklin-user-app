import Toast from 'react-native-toast-message';

export const showToast = ({type, title, message, top, bottom}) => {
  Toast.show({
    type: type === 1 ? 'info' : type === 0 ? 'error' : 'success',
    text1: 'Notification Message' || title,
    text2: message,
    text1Style: {
      // lineHeight: 20,
    },
    text2Style: {
      // lineHeight: 20,
    },
    position: bottom ? 'bottom' : 'top',
    bottomOffset: bottom,
    topOffset: top || 30,
    autoHide: true,
    onPress: () => {
      Toast.hide();
    },
  });
};
