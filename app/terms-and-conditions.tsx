import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SectionItem {
  id: number;
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  content?: string[];
  bullets?: string[];
  footer?: string;
}

const termsSections: SectionItem[] = [
  {
    id: 1,
    title: "Platform Overview",
    icon: "layers-outline",
    content: ["Veetu Rusi operates through a structured network:"],
    bullets: [
      "Super Admin manages the entire platform.",
      "Franchise Admin manages operations within assigned regions.",
      "Home Chefs prepare and fulfill food orders.",
      "Delivery Partners deliver food to customers.",
      "Customers place orders through the platform.",
    ],
    footer:
      "Veetu Rusi facilitates ordering, payment processing, and delivery coordination.",
  },
  {
    id: 2,
    title: "User Registration & Accounts",
    icon: "account-circle-outline",
    content: [
      "Users may create an account to place orders, track deliveries, and manage preferences.",
      "Users are responsible for maintaining the confidentiality of their login credentials and for all activities performed through their accounts.",
    ],
  },
  {
    id: 3,
    title: "Food Ordering",
    icon: "silverware-fork-knife",
    content: [
      "Customers can browse available food items, place orders, and make payments through approved payment methods.",
      "Orders are considered confirmed only after successful payment verification or order acceptance by the platform.",
    ],
  },
  {
    id: 4,
    title: "Home Chef Responsibilities",
    icon: "chef-hat",
    content: ["Home chefs registered on the platform are responsible for:"],
    bullets: [
      "Preparing food hygienically and safely.",
      "Using quality ingredients.",
      "Providing accurate menu information.",
      "Completing accepted orders on time.",
      "Complying with food safety regulations.",
    ],
  },
  {
    id: 5,
    title: "Franchise Admin Responsibilities",
    icon: "storefront-outline",
    content: [
      "Franchise administrators are responsible for managing operational activities within their assigned region.",
    ],
    bullets: [
      "Managing home chefs.",
      "Managing delivery personnel.",
      "Monitoring service quality.",
      "Ensuring compliance with platform policies.",
    ],
  },
  {
    id: 6,
    title: "Delivery Partner Responsibilities",
    icon: "moped-outline",
    content: [
      "Delivery partners are responsible for collecting food orders and delivering them safely to customers.",
    ],
    bullets: [
      "Maintaining professionalism.",
      "Ensuring timely delivery.",
      "Handling food with care.",
      "Protecting customer privacy.",
    ],
  },
  {
    id: 7,
    title: "Pricing & Payments",
    icon: "currency-inr",
    content: [
      "All prices displayed on the platform are in Indian Rupees (₹) unless otherwise specified.",
      "Prices, taxes, and delivery charges may change without prior notice. Payment must be completed through approved payment methods.",
    ],
  },
  {
    id: 8,
    title: "Order Cancellation",
    icon: "close-circle-outline",
    content: [
      "Customers may cancel an order before food preparation begins.",
      "Once food preparation has started, cancellations may not be eligible for refunds.",
      "Veetu Rusi reserves the right to cancel orders due to product unavailability, technical issues, payment failures, or suspected fraudulent activity.",
    ],
  },
  {
    id: 9,
    title: "Refund Policy",
    icon: "cash-refund",
    content: ["Refunds may be issued in the following circumstances:"],
    bullets: [
      "Order not delivered.",
      "Duplicate payment.",
      "Wrong item delivered.",
      "Verified food quality issues.",
    ],
    footer:
      "Approved refunds are generally processed within 5–7 business days.",
  },
  {
    id: 10,
    title: "Delivery Policy",
    icon: "truck-fast-outline",
    content: [
      "Delivery times are estimates and may vary due to traffic, weather conditions, operational delays, or high demand.",
      "Customers must ensure that delivery information is accurate and that someone is available to receive the order.",
    ],
  },
  {
    id: 11,
    title: "Food Quality & Safety",
    icon: "shield-check-outline",
    content: [
      "Home chefs are responsible for maintaining food quality, hygiene, and ingredient standards.",
      "Customers are encouraged to review ingredient information and disclose food allergies where applicable.",
    ],
  },
  {
    id: 12,
    title: "User Conduct",
    icon: "account-alert-outline",
    content: ["Users shall not:"],
    bullets: [
      "Provide false information.",
      "Attempt unauthorized access to the platform.",
      "Engage in fraudulent transactions.",
      "Harass chefs, delivery partners, or staff.",
      "Misuse platform services.",
    ],
  },
  {
    id: 13,
    title: "Privacy Policy",
    icon: "lock-outline",
    content: [
      "Customer information is collected only for order processing, delivery, customer support, and service improvement.",
      "We do not sell personal information to third parties.",
    ],
  },
  {
    id: 14,
    title: "Intellectual Property",
    icon: "certificate-outline",
    content: [
      "All content including logos, images, designs, software, trademarks, and text belongs to Veetu Rusi and is protected under applicable intellectual property laws.",
    ],
  },
  {
    id: 15,
    title: "Limitation of Liability",
    icon: "alert-circle-outline",
    content: [
      "Veetu Rusi acts as a platform connecting customers, franchise administrators, home chefs, and delivery partners.",
      "We shall not be liable for delays, interruptions, incorrect customer information, or circumstances beyond our control.",
    ],
  },
  {
    id: 16,
    title: "Suspension & Termination",
    icon: "account-cancel-outline",
    content: [
      "Veetu Rusi reserves the right to suspend or terminate any account found violating platform policies, legal requirements, or ethical standards.",
    ],
  },
  {
    id: 17,
    title: "Changes to Terms",
    icon: "update",
    content: [
      "We reserve the right to update or modify these Terms & Conditions at any time without prior notice.",
      "Continued use of the platform constitutes acceptance of the updated terms.",
    ],
  },
  {
    id: 18,
    title: "Governing Law",
    icon: "gavel",
    content: [
      "These Terms & Conditions shall be governed by the laws of India. Any disputes arising from the use of the platform shall be subject to the jurisdiction of the courts of Tamil Nadu.",
    ],
  },
];

export default function TermsAndConditionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-borderLight bg-white px-[18px] py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
        </Pressable>
        <Text className="text-[20px] font-bold text-text">
          Terms & Conditions
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      >
        {/* Intro Card */}
        <View className="mb-4 rounded-[22px] border border-borderLight bg-white p-5 shadow-sm shadow-black/5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View className="rounded-full bg-amber-50 px-3 py-1 border border-amber-200">
              <Text className="text-[11px] font-bold text-amber-800">
                Last Updated: June 16, 2026
              </Text>
            </View>
          </View>

          <Text className="text-[22px] font-black text-text">
            Terms & Conditions
          </Text>

          <Text className="mt-2.5 text-[14px] leading-relaxed text-textSecondary font-medium">
            Welcome to Veetu Rusi. By accessing or using our platform, website,
            or mobile application, you agree to comply with these Terms &
            Conditions. These terms govern the relationship between customers,
            franchise administrators, home chefs, delivery partners, and platform
            administrators.
          </Text>

          <Text className="mt-2 text-[14px] leading-relaxed text-textSecondary font-medium">
            Veetu Rusi is a technology platform that connects customers with home
            chefs through a franchise-based food delivery network. If you do not
            agree with these terms, please discontinue using the platform.
          </Text>
        </View>

        {/* Sections */}
        {termsSections.map((section) => (
          <View
            key={section.id}
            className="mb-3.5 rounded-[20px] border border-borderLight bg-white p-4 shadow-sm shadow-black/5"
          >
            {/* Section Header */}
            <View className="flex-row items-center mb-2.5">
              <View className="mr-2.5 h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                <Text className="text-[13px] font-black text-primary">
                  {section.id}
                </Text>
              </View>
              <Text className="flex-1 text-[16px] font-bold text-text">
                {section.title}
              </Text>
              {section.icon && (
                <MaterialCommunityIcons
                  name={section.icon}
                  size={18}
                  color={colors.textSecondary}
                />
              )}
            </View>

            {/* Paragraphs */}
            {section.content?.map((text, idx) => (
              <Text
                key={idx}
                className={`text-[14px] leading-relaxed text-textSecondary font-medium ${
                  idx > 0 ? "mt-2" : ""
                }`}
              >
                {text}
              </Text>
            ))}

            {/* Bullets */}
            {section.bullets && section.bullets.length > 0 && (
              <View className="mt-2.5 space-y-1.5 pl-1">
                {section.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} className="flex-row items-start mb-1.5">
                    <View className="mr-2.5 mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <Text className="flex-1 text-[14px] leading-5 text-textSecondary font-medium">
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Footer paragraph if any */}
            {section.footer && (
              <Text className="mt-2.5 text-[14px] leading-relaxed text-textSecondary font-medium">
                {section.footer}
              </Text>
            )}
          </View>
        ))}

        {/* Need Help / Contact Card */}
        <View className="mt-2 rounded-[22px] border border-borderLight bg-white p-5 shadow-sm shadow-black/5">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MaterialCommunityIcons
                name="lifebuoy"
                size={22}
                color={colors.primary}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-text">
                Have questions about these terms?
              </Text>
              <Text className="text-[13px] text-textSecondary font-medium">
                Our support team is always ready to assist you.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/help-support")}
            className="mt-4 flex-row items-center justify-center rounded-xl bg-primary py-3 active:opacity-90"
          >
            <MaterialCommunityIcons
              name="headset"
              size={18}
              color="#FFFFFF"
              className="mr-2"
            />
            <Text className="text-[15px] font-bold text-white ml-2">
              Contact Help & Support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
