import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * ScreenContainer - A consistent wrapper for all screens with safe area support
 * 
 * Props:
 * - safeTop: boolean (default: true) - Apply top safe area padding
 * - safeBottom: boolean (default: true) - Apply bottom safe area padding
 * - safeLeft: boolean (default: false) - Apply left safe area padding (for landscape)
 * - safeRight: boolean (default: false) - Apply right safe area padding (for landscape)
 * - color: string - Background color
 * - style: object - Additional styles
 */
function ScreenContainer({
  style,
  color,
  children,
  safeTop = true,
  safeBottom = true,
  safeLeft = false,
  safeRight = false,
}) {
  const insets = useSafeAreaInsets();

  const containerStyle = {
    flex: 1,
    backgroundColor: color || '#fff',
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
    paddingLeft: safeLeft ? insets.left : 0,
    paddingRight: safeRight ? insets.right : 0,
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

export default ScreenContainer;
