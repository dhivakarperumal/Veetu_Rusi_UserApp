import colors from "@/config/colors";
import { SafeAreaView, Text, View } from "react-native";

export default function MoreScreen() {
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
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
    </SafeAreaView>
  );
}
