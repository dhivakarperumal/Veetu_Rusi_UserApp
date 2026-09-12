import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const supportChannels = [
  {
    title: "Call Support",
    subtitle: "+91 98765 43210",
    icon: "phone",
  },
  {
    title: "Email Us",
    subtitle: "support@veeturusi.com",
    icon: "email-outline",
  },
  {
    title: "Chat With Us",
    subtitle: "Available 9:00 AM - 9:00 PM",
    icon: "message-text-outline",
  },
];

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);

  const submitTicket = () => {
    if (!ticket.trim()) {
      Alert.alert("Help & Support", "Please describe your issue first.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Ticket submitted",
        "Our support team will contact you shortly.",
      );
      setTicket("");
    }, 400);
  };

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
        <Text className="text-[22px] font-bold text-text">Help & Support</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <View className="mx-5 mt-4 rounded-[26px] border border-borderLight bg-white p-5 shadow-sm shadow-black/10">
          <Text className="text-[24px] font-black text-text">Need help?</Text>
          <Text className="mt-2 text-[14px] font-medium text-textSecondary">
            Tell us what happened and our team will help you with your order,
            delivery, profile, or food experience.
          </Text>
        </View>

        <View className="mx-5 mt-4 rounded-[26px] border border-borderLight bg-white p-4 shadow-sm shadow-black/10">
          <Text className="mb-4 text-[16px] font-black text-text">
            Contact channels
          </Text>

          {supportChannels.map((item) => (
            <View
              key={item.title}
              className="mb-3 flex-row items-center rounded-[14px] border border-borderLight bg-background px-4 py-3"
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MaterialCommunityIcons
                  name={
                    item.icon as keyof typeof MaterialCommunityIcons.glyphMap
                  }
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-black text-text">
                  {item.title}
                </Text>
                <Text className="text-[12px] font-medium text-textSecondary">
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mx-5 mt-4 rounded-[26px] border border-borderLight bg-white p-4 shadow-sm shadow-black/10">
          <Text className="mb-3 text-[16px] font-black text-text">
            Raise a ticket
          </Text>
          <TextInput
            className="rounded-[14px] border border-borderLight bg-background px-4 py-3 text-[14px] font-medium text-text"
            value={ticket}
            onChangeText={setTicket}
            placeholder="Describe your issue"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={submitTicket}
            disabled={loading}
            className="mt-4 items-center rounded-[14px] bg-primary px-4 py-3"
          >
            <Text className="text-[14px] font-black text-white">
              {loading ? "Submitting..." : "Submit Request"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
