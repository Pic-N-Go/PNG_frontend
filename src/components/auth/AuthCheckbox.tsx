import React from 'react';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  checked: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
};

export default function AuthCheckbox({ checked, onPress, size = 'md' }: Props) {
  const dim = size === 'sm' ? 18 : 22;
  const radius = size === 'sm' ? 5 : 6;
  const borderColor = checked
    ? '#E31B59'
    : size === 'sm'
    ? 'rgba(0,0,0,0.12)'
    : 'rgba(0,0,0,0.18)';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        borderWidth: 1.2,
        borderColor,
        backgroundColor: checked ? '#E31B59' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Feather name="check" size={size === 'sm' ? 10 : 12} color="#fff" />
      )}
    </Pressable>
  );
}
