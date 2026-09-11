import AppHeader from "@/components/AppHeader";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <AppHeader title="My Wallet" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View className="rounded-[22px] border border-borderLight bg-white p-5 shadow-sm">
          <Text className="text-[14px] font-black uppercase text-textSecondary">
            Wallet Balance
          </Text>
          <Text className="mt-2 text-[30px] font-black text-primary">₹250</Text>
          <Text className="mt-2 text-[13px] font-medium text-textSecondary">
            Available for your next order
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
