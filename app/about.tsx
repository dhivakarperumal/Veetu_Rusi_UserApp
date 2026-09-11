import AppHeader from "@/components/AppHeader";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <AppHeader title="About Veetu Rusi" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View className="rounded-[22px] border border-borderLight bg-white p-5 shadow-sm">
          <Text className="text-[18px] font-black text-text">Veetu Rusi</Text>
          <Text className="mt-3 text-[13px] font-medium text-textSecondary">
            Fresh homemade food from local home chefs. Order tasty, hygienic,
            and homemade meals directly from your neighborhood kitchen.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-[14px] border border-border px-4 py-3"
        >
          <Text className="text-center text-[14px] font-black text-text">
            Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
