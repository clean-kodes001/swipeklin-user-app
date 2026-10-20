import {
  Keyboard,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import React, {useRef} from 'react';
const KeyboardAvoidingView = ({
  children,
  scrollToEnd,
  style,
  withScroll = true,
  ...props
}) => {
  const scrollView = useRef();

  return (
    <RNKeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 10}
      style={[styles.container, style]}>
      <Pressable
        onPress={() => {
          scrollToEnd &&
            withScroll &&
            scrollView.current?.scrollToEnd({animated: true});
          Keyboard.dismiss();
        }}
        style={styles.container}
        pointerEvents="box-none">
        {withScroll ? (
          <ScrollView
            ref={scrollView}
            onContentSizeChange={() =>
              scrollToEnd && scrollView.current?.scrollToEnd({animated: true})
            }
            showsVerticalScrollIndicator={false}
            style={styles.container}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            {...props}>
            {children}
          </ScrollView>
        ) : (
          <View style={styles.container} {...props}>
            {children}
          </View>
        )}
      </Pressable>
    </RNKeyboardAvoidingView>
  );
};

export default KeyboardAvoidingView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
