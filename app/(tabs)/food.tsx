import AppHeader from "@/components/AppHeader";
import { colors } from "@/config/colors";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
      }}
    >
      <AppHeader title="Food" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-text">
          Food
        </Text>
        <Text className="mt-3 text-base text-textSecondary">
          Browse our delicious meals
        </Text>
      </View>
    </View>
  );
}
