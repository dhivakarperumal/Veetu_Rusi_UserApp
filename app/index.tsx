import { SafeAreaView, Text, View } from "react-native";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-red-500">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-white">Veetu Rusi</Text>
        <Text className="mt-3 text-base text-slate-300">
          Tailwind is connected and ready.
        </Text>
      </View>
    </SafeAreaView>
  );
}
