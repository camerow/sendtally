import React from "react";
import { Pressable, Text, View } from "react-native";
import type { PostActionFeature, PostStatusVM } from "@sendtally/features/session-detail";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";

export type PostStatusBarProps = {
  post: PostStatusVM;
  action: PostActionFeature;
};

export function PostStatusBar({ post, action }: PostStatusBarProps): React.ReactElement {
  const message = action.error ?? post.detail;
  return (
    <View
      style={{
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.lineOnLight,
        gap: 12,
      }}
    >
      <View style={{ gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.7,
            color: post.alert ? colors.watermelonInk : colors.textMuted,
          }}
        >
          {post.label}
        </Text>
        {message !== null && (
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              lineHeight: 17,
              color: colors.textMuted,
            }}
          >
            {message}
          </Text>
        )}
      </View>
      {post.action !== null && (
        <Pressable
          onPress={action.run}
          disabled={action.busy}
          style={press({
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
            borderRadius: radius.control,
            paddingHorizontal: 18,
            opacity: action.busy ? 0.55 : 1,
          })}
        >
          <Text
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSecondary }}
          >
            {action.busy ? "Posting…" : post.actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
