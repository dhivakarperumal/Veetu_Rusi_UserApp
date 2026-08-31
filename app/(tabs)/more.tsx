import colors from "@/config/colors";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          More
        </Text>
        <Text
          className="mt-3 text-base"
          style={{ color: colors.textSecondary }}
        >
          Additional options and settings
        </Text>
      </View>
    </View>
  );
}
