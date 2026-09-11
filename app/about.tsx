import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-borderLight bg-white px-[18px] py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
        </Pressable>
        <Text className="text-[22px] font-bold text-text">
          About Veetu Rusi
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View className="rounded-[22px] border border-borderLight bg-white p-5 shadow-sm">
          <Text className="text-[18px] font-black text-text">Veetu Rusi</Text>
          <Text className="mt-3 text-[13px] font-medium text-textSecondary">
            Fresh homemade food from local home chefs. Order tasty, hygienic,
            and homemade meals directly from your neighborhood kitchen.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
