import AppHeader from "@/components/AppHeader";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
      }}
    >
      <AppHeader title="Home" />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-text">
          Home
        </Text>
        <Text className="mt-3 text-base text-textSecondary">
          Welcome to Veetu Rusi
        </Text>
      </View>
    </View>
  );
}
