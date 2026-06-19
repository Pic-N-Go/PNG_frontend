import React, { useState } from 'react';
import { TextInput, View, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { INPUT_HEIGHT, INPUT_RADIUS, FONT_MD } from '@/constants/layout';

type Props = TextInputProps & {
  icon: React.ComponentProps<typeof Feather>['name'];
  isInvalid?: boolean;
  rightElement?: React.ReactNode;
};

export default function AuthInput({ icon, isInvalid, rightElement, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = isInvalid ? '#FF3B30' : focused ? '#E31B59' : 'transparent';
  const bgColor = focused || isInvalid ? '#fff' : '#F5F5F7';
  const iconColor = focused ? '#E31B59' : 'rgba(0,0,0,0.25)';

  return (
    <View
      style={{
        height: INPUT_HEIGHT,
        borderRadius: INPUT_RADIUS,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: bgColor,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Feather name={icon} size={20} color={iconColor} style={{ position: 'absolute', left: 16 }} />
      <TextInput
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="rgba(0,0,0,0.28)"
        style={[
          {
            flex: 1,
            paddingLeft: 46,
            paddingRight: rightElement ? 48 : 16,
            fontSize: FONT_MD,
            color: '#000',
            letterSpacing: -0.3,
            fontFamily: 'Pretendard-Regular',
          },
          style,
        ]}
        {...rest}
      />
      {rightElement && (
        <View style={{ position: 'absolute', right: 14 }}>
          {rightElement}
        </View>
      )}
    </View>
  );
}
