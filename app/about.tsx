import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const specialFeatures = [
  {
    title: "Authentic Homemade Food",
    desc: "Freshly prepared meals crafted by passionate home chefs using traditional recipes and quality ingredients.",
    icon: "silverware-fork-knife" as const,
    badge: "100% Homemade",
  },
  {
    title: "Empowering Home Chefs",
    desc: "Every order supports local home chefs, helping them grow their business and reach more customers.",
    icon: "chef-hat" as const,
    badge: "Community First",
  },
  {
    title: "Fast & Reliable Delivery",
    desc: "Our delivery partners ensure that every meal reaches customers fresh, hot, and on time.",
    icon: "moped-outline" as const,
    badge: "Hot & Fresh",
  },
];

const coreValues = [
  {
    title: "Quality Food",
    desc: "Fresh ingredients and hygienic preparation standards in every meal.",
    icon: "food-drumstick-outline" as const,
  },
  {
    title: "Community",
    desc: "Connecting customers with talented home chefs in their locality.",
    icon: "account-group-outline" as const,
  },
  {
    title: "Reliable Delivery",
    desc: "Ensuring meals reach customers quickly, hygienically, and safely.",
    icon: "truck-delivery-outline" as const,
  },
  {
    title: "Partnership",
    desc: "Supporting franchise owners, home chefs, and delivery partners to grow together.",
    icon: "handshake-outline" as const,
  },
];

export default function AboutScreen() {
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
        <Text className="text-[20px] font-bold text-text">About Us</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      >
        {/* --- HERO SECTION --- */}
        <View className="mb-5 rounded-[24px] border border-borderLight bg-white p-5 shadow-sm shadow-black/5">
          {/* Tagline Badge */}
          <View className="self-start rounded-full bg-primary/10 px-3 py-1 mb-3">
            <Text className="text-[10px] font-black uppercase tracking-wider text-primary">
              Bringing Homemade Goodness to Every Doorstep
            </Text>
          </View>

          {/* Heading */}
          <Text className="text-[26px] font-black text-text leading-[34px]">
            Freshly prepared,{"\n"}
            <Text className="text-primary font-black">lovingly served</Text>
          </Text>

          {/* Banner Image with Floating Badge */}
          <View className="relative mt-4 overflow-hidden rounded-[20px] h-[190px] w-full">
            <ImageBackground
              source={require("../assets/images/hero bg.png")}
              resizeMode="cover"
              className="h-full w-full"
            >
              <View className="absolute inset-0 bg-black/20" />
              {/* Floating Badge */}
              <View className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/90 p-3.5 backdrop-blur-md border border-white/40 shadow-md shadow-black/20">
                <Text className="text-[14px] font-black text-text">
                  Taste of Home
                </Text>
                <Text className="mt-0.5 text-[11px] font-medium text-textSecondary">
                  Freshly cooked meals made with love, delivered with care.
                </Text>
              </View>
            </ImageBackground>
          </View>

          {/* Mission Paragraph */}
          <Text className="mt-4 text-[14px] leading-relaxed text-textSecondary font-medium">
            At Veetu Rusi, we believe food should taste just like home. Our mission
            is to connect customers with passionate home chefs who prepare fresh,
            authentic meals using quality ingredients and traditional recipes.
            Every order supports local culinary talent while delivering wholesome
            food straight to your doorstep.
          </Text>

          {/* Stats Counters */}
          <View className="mt-5 flex-row items-center justify-around rounded-[18px] bg-backgroundAlt border border-borderLight py-4 px-2">
            <View className="items-center flex-1">
              <Text className="text-[24px] font-black text-primary">500+</Text>
              <Text className="mt-1 text-[11px] font-bold uppercase tracking-wider text-textSecondary">
                Home Chefs
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-borderLight" />

            <View className="items-center flex-1">
              <Text className="text-[24px] font-black text-primary">10K+</Text>
              <Text className="mt-1 text-[11px] font-bold uppercase tracking-wider text-textSecondary">
                Happy Customers
              </Text>
            </View>

            <View className="h-8 w-[1px] bg-borderLight" />

            <View className="items-center flex-1">
              <Text className="text-[24px] font-black text-primary">100%</Text>
              <Text className="mt-1 text-[11px] font-bold uppercase tracking-wider text-textSecondary">
                Authentic
              </Text>
            </View>
          </View>
        </View>

        {/* --- WHAT MAKES VEETU RUSI SPECIAL --- */}
        <View className="mb-5 rounded-[24px] border border-borderLight bg-amber-50/50 p-5 shadow-sm shadow-black/5">
          <View className="items-center mb-4">
            <View className="rounded-full bg-primary/10 px-3.5 py-1 mb-2">
              <Text className="text-[10px] font-black uppercase tracking-wider text-primary">
                Our Difference
              </Text>
            </View>
            <Text className="text-center text-[22px] font-black text-text">
              What Makes{"\n"}
              <Text className="text-primary font-black">Veetu Rusi Special</Text>
            </Text>
            <View className="mt-2.5 h-1 w-12 rounded-full bg-primary" />
          </View>

          {/* Feature Cards */}
          <View className="space-y-3">
            {specialFeatures.map((item, idx) => (
              <View
                key={idx}
                className="rounded-[20px] border border-borderLight bg-white p-4 shadow-sm shadow-black/5 mb-3"
              >
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View className="rounded-full bg-amber-100/70 px-2.5 py-0.5 border border-amber-200">
                    <Text className="text-[10px] font-bold text-amber-900">
                      {item.badge}
                    </Text>
                  </View>
                </View>

                <Text className="text-[16px] font-bold text-text">
                  {item.title}
                </Text>
                <Text className="mt-1.5 text-[13px] leading-relaxed text-textSecondary font-medium">
                  {item.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- OUR CORE VALUES --- */}
        <View className="mb-5 rounded-[24px] border border-borderLight bg-white p-5 shadow-sm shadow-black/5">
          <View className="items-center mb-5">
            <View className="rounded-full border border-border px-4 py-1 mb-2.5">
              <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-textSecondary">
                Our Core Values
              </Text>
            </View>

            <Text className="text-center text-[22px] font-black text-primary">
              Serving Communities with Purpose
            </Text>

            <Text className="mt-2 text-center text-[13px] leading-relaxed text-textSecondary font-medium">
              At Veetu Rusi, we are committed to delivering authentic homemade
              food, empowering local home chefs, supporting franchise partners,
              and ensuring every customer enjoys a fresh and satisfying dining
              experience.
            </Text>
          </View>

          {/* 4 Core Value Cards in 2x2 Grid */}
          <View className="flex-row flex-wrap justify-between">
            {coreValues.map((v, i) => (
              <View
                key={i}
                className="mb-3 w-[48%] rounded-[18px] border border-borderLight bg-backgroundAlt p-3.5 shadow-sm shadow-black/5"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/15 mb-2.5">
                  <MaterialCommunityIcons
                    name={v.icon}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text className="text-[14px] font-bold text-text">
                  {v.title}
                </Text>
                <Text className="mt-1 text-[11px] leading-4 text-textSecondary font-medium">
                  {v.desc}
                </Text>
                <View className="mt-3 h-[2px] w-6 rounded-full bg-primary" />
              </View>
            ))}
          </View>
        </View>

        {/* --- CALL TO ACTION FOOTER --- */}
        <View className="rounded-[24px] bg-primary p-6 shadow-md shadow-primary/20">
          <Text className="text-[20px] font-black text-white text-center">
            Craving a Delicious Home Meal?
          </Text>
          <Text className="mt-1.5 text-[13px] text-white/90 text-center font-medium">
            Explore authentic flavors cooked fresh by chefs near you.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/food")}
            className="mt-4 flex-row items-center justify-center rounded-full bg-white py-3 px-5 shadow-sm active:opacity-90"
          >
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={18}
              color={colors.primary}
            />
            <Text className="ml-2 text-[14px] font-extrabold text-primary">
              Browse Menu & Order
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
