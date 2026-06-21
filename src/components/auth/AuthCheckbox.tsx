import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ICON_SM, ICON_MD } from '@/constants/layout';

type Props = {
  checked: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
};

export default function AuthCheckbox({ checked, onPress, size = 'md' }: Props) {
  const dim = size === 'sm' ? ICON_SM : ICON_MD;
  const radius = size === 'sm' ? 5 : 6;
  const borderColor = checked
    ? '#E31B59'
    : size === 'sm'
    ? 'rgba(0,0,0,0.12)'
    : 'rgba(0,0,0,0.18)';

  const boxStyle = {
    width: dim,
    height: dim,
    borderRadius: radius,
    borderWidth: 1.2,
    borderColor,
    backgroundColor: checked ? '#E31B59' : 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const content = checked ? (
    <Feather name="check" size={size === 'sm' ? 10 : 12} color="#fff" />
  ) : null;

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8} style={boxStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={boxStyle}>{content}</View>;
}
