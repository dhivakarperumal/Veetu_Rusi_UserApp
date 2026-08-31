import colors from "@/config/colors";
import { SafeAreaView, Text, View } from "react-native";

export default function OrdersScreen() {
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          Orders
        </Text>
        <Text
          className="mt-3 text-base"
          style={{ color: colors.textSecondary }}
        >
          View your order history
        </Text>
      </View>
    </SafeAreaView>
  );
}
