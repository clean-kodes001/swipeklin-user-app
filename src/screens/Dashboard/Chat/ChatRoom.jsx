import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';

import {useDispatch, useSelector} from 'react-redux';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  FlatList,
  Platform,
  InteractionManager,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Text from '../../../components/Shared/Text';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';
import Echo from 'laravel-echo';
import pusherConfig from '../../../../pusher.json';
import MyChat from '../../../components/chat/MyChat';
import ChatBtm from '../../../components/chat/ChatBtm';
import OthersChat from '../../../components/chat/OthersChat';

import timeformatter from '../../../utils/timeformatter';

import ScreenContainer from '../../../components/Shared/ScreenContainer';
import ChatScreenHead from '../../../components/chat/ChatScreenHead';
import Head from '../../../components/Shared/Head';
import {getChat} from '../../../store/actions/chats/getChats';
import {clearRoom} from '../../../store/reducer/chatSlice';
import {getClean} from '../../../store/actions/dashboard/getClean';
import {useTranslation} from 'react-i18next';

const ChatRoom = ({navigation, route}) => {
  const {t} = useTranslation();
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const cleanData = useSelector(state => state.user.clean);
  const [_chats, _setChats] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [typingTimer, setTypingTimer] = useState('');

  const {chats} = useSelector(state => state.chat);
  const {user} = useSelector(state => state.user);
  const flatListRef = useRef();

  useEffect(() => {
    if (!cleanData || !cleanData?.id) {
    // Use InteractionManager to wait for cleanup effects to complete
      // This prevents 'Cannot remove child' errors during navigation
      const handle = InteractionManager.runAfterInteractions(() => {
        navigation.navigate('Home');
      });
      return () => handle.cancel();
    }
  }, [cleanData?.id]);
  useEffect(() => {
    dispatch(getChat());
    // Sync messageCount when chat room opens
    dispatch(getClean());

    // console.log('CCC', _chats);
    return () => dispatch(clearRoom());
  }, []);

  // Scroll to bottom when keyboard shows (especially for Android)
  useEffect(() => {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardShowListener = Keyboard.addListener(keyboardShowEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Increased timeout to ensure keyboard is fully visible before scrolling
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 300);
    });

    return () => {
      keyboardShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (chats) {
      const adaptedChats = chats.map(chat => {
        return {
          message: chat.message,
          // Backend message type (text | image); local `type` below is ownership.
          messageType: chat.type || 'text',
          type:
            user.id === chat.sender_id
              ? 'mine'
              : !chat.sender
              ? 'notification'
              : 'others',
          time: chat.created_at,
          first_name: chat?.sender?.name,
          status: 'sent',
          avatar: chat?.receiver?.avatar,
        };
      });
      _setChats(adaptedChats);
    }
  }, [chats]);

  const pushMyChat = (message, time, messageType = 'text') => {
    const formattedTime = timeformatter(time, 'time_only');
    _setChats(prev => [
      ...prev,
      {
        type: 'mine',
        messageType,
        message,
        time: time,
      },
    ]);
    // Scroll to bottom after sending message
    setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
  };

  const incomingMessage = (message, sender) => {
    // const formattedTime = timeformatter(new Date(), 'time_only');

    if (user.id === sender.id) {
    } else {
      _setChats(prev => [
        ...prev,
        {
          user,
          first_name: sender?.name,
          type: 'others',
          messageType: message?.type ?? 'text',
          message: message?.message,
          time: new Date(),
        },
      ]);
      // Scroll to bottom after receiving message
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
    }
  };

  const [token, setToken] = useState(null);
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');

          setToken(token);
          if (!token) {
            dispatch(logOut());
          }
        } catch (error) {}
      })();
    }),
  );

  const PusherClient = useMemo(
    () =>
      token
        ? new Pusher(pusherConfig.key, {
            ...pusherConfig,
            auth: {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
            userAuthentication: {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
          })
        : null,
    [token],
  );

  const echo = useMemo(
    () =>
      PusherClient
        ? new Echo({
            broadcaster: 'pusher',
            client: PusherClient,
          })
        : null,
    [PusherClient],
  );

  const cleanID = cleanData?.id;
  useEffect(() => {
    if (!echo || !cleanID) {
      return;
    }

    echo
      .join(`chat.${cleanID}`)
      .here(users => {})
      .joining(user => {})
      .leaving(user => {})
      .listen('.chat.message', ({message, user}) => {
        incomingMessage(message, user);
      })
      .listenForWhisper('typing', e => {
        setTypingUser(e.name);
        if (typingTimer) {
          clearTimeout(typingTimer);
        }
        setTypingTimer(
          setTimeout(() => {
            setTypingUser('');
          }, 10000),
        );
      })
      .error(e => {
        // showToast({type: 1, message: 'Unable to connect to chat...'});
      });

    return () => {
      if (echo) {
        echo.leaveAllChannels();
      }
    };
  }, [cleanID, echo]);

  const startTyping = useCallback(() => {
    if (!echo || !cleanID) return;
    echo.join(`chat.${cleanID}`).whisper('typing', {name: user?.name});
  }, [echo, user, cleanID]);

  const handleDisplayImages = images => {
    const _images = images.map(image => ({
      uri: image,
    }));

    navigation.navigate('viewimages', {
      images: _images,

      startIndex: 0,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'top', 'left']}>
      <RNKeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <View style={{marginHorizontal: 18}}>
            <Head
              custom
              pageTitle={t('chat.title')}
              // disableSecondButton={!cleanData?.images_link?.length > 1}
              // handleSecondButton={() => {
              //   handleDisplayImages(cleanData?.images_link);
              // }}
              // secondButtonTitle={t('chat.view_property_images')}
              type={2}
              navigation={navigation}
            />
          </View>
          <ChatScreenHead navigation={navigation} sender={chats?.sender} />
          {typingUser && (
            <Text style={styles.typingUser}>{typingUser} is typing ...</Text>
          )}

          <FlatList
            ref={flatListRef}
            removeClippedSubviews={false}
            style={{flex: 1}}
            contentContainerStyle={[styles.chatContent, {paddingBottom: 20}]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({animated: true})
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({animated: false})
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            data={_chats}
            keyExtractor={(item, index) => `${item.time}-${index}`}
            renderItem={({item, index}) => {
              const isLastItem =
                _chats.length > 0 ? _chats.length - 1 === index : true;
              const {message, type, time, first_name, messageType} = item;
              return type === 'mine' ? (
                <MyChat
                  message={message}
                  messageType={messageType}
                  onImagePress={() => handleDisplayImages([message])}
                  time={timeformatter(time)}
                  key={index}
                  isLastItem={isLastItem}
                />
              ) : type === 'others' ? (
                <OthersChat
                  avatar={user?.avatar}
                  first_name={first_name}
                  message={message}
                  messageType={messageType}
                  onImagePress={() => handleDisplayImages([message])}
                  time={timeformatter(time)}
                  key={index}
                />
              ) : type === 'notification' ? (
                <View key={index} style={styles.notification}>
                  <Text style={{fontSize: 12, color: '#112950'}}>
                    {message}
                  </Text>
                  <Text style={{fontSize: 10, color: '#112950'}}>
                    {timeformatter(time)}
                  </Text>
                </View>
              ) : null;
            }}
          />
          <ChatBtm
            pushMyChat={pushMyChat}
            startTyping={() => startTyping()}
          />
      </RNKeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatContent: {
    position: 'relative',
    marginHorizontal: 18,
  },
  notification: {
    backgroundColor: '#F2F4F5',
    paddingHorizontal: 16,
    paddingVertical: 4,

    alignSelf: 'center',
    marginVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  typingUser: {
    color: 'green',
    textAlign: 'center',
  },
});
