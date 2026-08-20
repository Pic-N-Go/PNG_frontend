import React, { useState } from "react";
import { TextInput, View, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import { INPUT_HEIGHT, INPUT_RADIUS, FONT_MD , BORDER_CONTROL } from "@/constants/layout";
import { BRAND, CARD } from '@/constants/colors';

type Props = TextInputProps & {
  icon: React.ComponentProps<typeof Feather>["name"];
  isInvalid?: boolean;
  rightElement?: React.ReactNode;
};

export default function AuthInput({
  icon,
  isInvalid,
  rightElement,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = isInvalid
    ? "#FF3B30"
    : focused
      ? BRAND
      : "transparent";
  const bgColor = focused || isInvalid ? "#fff" : CARD;
  const iconColor = focused ? BRAND : "rgba(0,0,0,0.25)";

  return (
    <View
      style={{
        height: INPUT_HEIGHT,
        borderRadius: INPUT_RADIUS,
        borderWidth: BORDER_CONTROL,
        borderColor,
        backgroundColor: bgColor,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Feather
        name={icon}
        size={20}
        color={iconColor}
        style={{ position: "absolute", left: 16 }}
      />
      <TextInput
        placeholderTextColor="rgba(0,0,0,0.28)"
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          {
            flex: 1,
            paddingLeft: 46,
            paddingRight: rightElement ? 48 : 16,
            fontSize: FONT_MD,
            color: "#000",
            letterSpacing: -0.3,
            fontFamily: "Pretendard-Regular",
          },
          style,
        ]}
      />
      {rightElement && (
        <View style={{ position: "absolute", right: 14 }}>{rightElement}</View>
      )}
    </View>
  );
}
