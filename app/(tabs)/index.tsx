import api from "@/app/api";
import { colors } from "@/config/colors";
import { useStore } from "@/context/StoreContext";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const staticCategories = [
  { label: "Meals", icon: "silverware-fork-knife" },
  { label: "Tiffin", icon: "food-outline" },
  { label: "Snacks", icon: "food" },
  { label: "Lunch Box", icon: "bag-carry-on" },
  { label: "Combos", icon: "food-variant" },
  { label: "Healthy", icon: "leaf" },
  { label: "Party Orders", icon: "party-popper" },
  { label: "Offers", icon: "tag" },
];

interface CategoryItem {
  c_name?: string;
  category_type?: string;
  name?: string;
  image?: string | string[];
  images?: string | string[];
  [key: string]: any;
}

const safeParse = (data: unknown) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    const parsed = JSON.parse(String(data));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getIconByCategory = (label: string) => {
  const lower = String(label).toLowerCase();
  if (lower.includes("snack")) return "restaurant";
  if (lower.includes("healthy")) return "leaf";
  if (lower.includes("combo")) return "fast-food";
  if (lower.includes("box")) return "bag";
  if (lower.includes("party")) return "sparkles";
  if (lower.includes("offer")) return "pricetag";
  if (lower.includes("tiff")) return "food";
  return "silverware-fork-knife";
};

const popularKitchens = [
  {
    name: "Akshaya Kitchen",
    type: "South Indian Meals",
    rating: "4.8",
    orders: "1.2K",
    time: "25 mins",
    tags: ["Hygienic", "Homemade"],
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Malathi's Kitchen",
    type: "Veg & Non-Veg Meals",
    rating: "4.7",
    orders: "980",
    time: "30 mins",
    tags: ["Traditional", "Fresh"],
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Sangeetha Kitchen",
    type: "South Indian | Tiffin",
    rating: "4.9",
    orders: "2.3K",
    time: "20 mins",
    tags: ["Tasty", "Affordable"],
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
  },
];

const foodTypes = [
  {
    name: "South Indian",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "North Indian",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Chinese",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Biriyani",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Healthy",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Desserts",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { categoriesCache, setCategoriesCache } = useStore();
  const [categories, setCategories] = useState<CategoryItem[]>(
    categoriesCache || [],
  );
  const [loading, setLoading] = useState(
    !categoriesCache || categoriesCache.length === 0,
  );

  const fetchCategories = useCallback(async () => {
    try {
      if (categoriesCache && categoriesCache.length > 0) {
        setCategories(categoriesCache);
        setLoading(false);
        return;
      }

      const res = await api.get("/home-chef-categories");
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map((cat: CategoryItem) => ({
        ...cat,
        name: cat.c_name || cat.name || "",
        images: safeParse(cat.image || cat.images),
      }));
      setCategories(mapped);
      setCategoriesCache(mapped);
    } catch (error) {
      console.error("Error fetching home chef categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [categoriesCache, setCategoriesCache]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3">
        <View className="flex-row items-center">
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text className="ml-2 text-[16px] font-bold text-text">
            600053, Chennai
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.textSecondary}
          />
        </View>
        <View className="flex-row items-center">
          <Pressable className="mr-4">
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.text}
            />
          </Pressable>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Text className="font-bold text-white">V</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-[#f8f8f7]"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-3">
          <View className="flex-row items-center rounded-xl border border-borderLight bg-white px-4 py-3">
            <Ionicons name="search-outline" size={22} color={colors.grayDark} />
            <TextInput
              placeholder="Search for meals, chefs, cuisines..."
              placeholderTextColor={colors.grayDark}
              className="ml-2 flex-1 text-[14px]"
            />
            <Ionicons name="filter" size={22} color={colors.grayDark} />
          </View>
        </View>

        <View className="mx-4 overflow-hidden rounded-[22px] bg-[#253B1F]">
          <View className="min-h-[180px] justify-between px-5 py-5">
            <View className="w-[70%]">
              <Text className="text-[28px] font-black text-white">
                Food Made with Love
              </Text>
              <Text className="mt-2 text-[15px] font-semibold text-[#dce7a0]">
                Fresh • Healthy • Hygienic
              </Text>
            </View>
            <View className="mt-6 flex-row items-center justify-between">
              <Pressable className="rounded-full bg-primary px-6 py-3">
                <Text className="font-bold text-white">Order Now →</Text>
              </Pressable>
              <View className="items-center">
                <Text className="text-[14px] font-bold text-[#ffe1bf]">
                  Good
                </Text>
                <Text className="text-[14px] font-bold text-[#ffe1bf]">
                  Food
                </Text>
                <Text className="text-[14px] font-bold text-[#ffe1bf]">
                  Happier
                </Text>
                <Text className="text-[14px] font-bold text-[#ffe1bf]">
                  You!
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-4 flex-row flex-wrap items-center justify-between">
          {loading ? (
            <View className="mb-3 h-[72px] w-full items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : categories.length > 0 ? (
            categories.slice(0, 8).map((c, index) => (
              <Pressable
                key={c.name || c.c_name || String(index)}
                className="mb-3 h-[72px] w-[24%] items-center justify-center"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                  <Ionicons
                    name={
                      getIconByCategory(
                        c.name || c.c_name || "Food",
                      ) as keyof typeof Ionicons.glyphMap
                    }
                    size={22}
                    color={index % 2 === 0 ? colors.primary : colors.secondary}
                  />
                </View>
                <Text className="mt-2 text-center text-[11px] font-semibold text-text">
                  {c.name || c.c_name || "Food"}
                </Text>
              </Pressable>
            ))
          ) : (
            staticCategories.map((c, index) => (
              <Pressable
                key={c.label}
                className="mb-3 h-[72px] w-[24%] items-center justify-center"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                  <Ionicons
                    name={c.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={index % 2 === 0 ? colors.primary : colors.secondary}
                  />
                </View>
                <Text className="mt-2 text-center text-[11px] font-semibold text-text">
                  {c.label}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <View className="mx-4 mt-1 rounded-[20px] border border-primary/30 bg-gradient-to-r from-[#ffe6d5] to-[#fffaf7] px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View className="w-[58%]">
              <Text className="text-[28px] font-black text-text">
                Flat 20% OFF
              </Text>
              <Text className="mt-1 text-[16px] font-semibold text-textSecondary">
                On First Order
              </Text>
              <View className="mt-4 rounded-xl border border-primary bg-white px-4 py-2">
                <Text className="font-bold text-primary">
                  Use Code HOMEMADE20
                </Text>
              </View>
            </View>
            <View className="h-24 w-24 items-center justify-center rounded-full border-[3px] border-primary bg-white">
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
                }}
                className="h-20 w-20 rounded-full"
              />
            </View>
          </View>
        </View>

        <View className="mt-5 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[27px] font-black text-text">
              Popular Near You
            </Text>
            <Text className="text-[14px] font-bold text-primary">See all</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {popularKitchens.map((k, i) => (
              <View
                key={k.name}
                className="mr-4 w-[210px] rounded-[18px] border border-border bg-white p-2"
              >
                <View className="relative">
                  <Image
                    source={{ uri: k.image }}
                    className="h-[130px] w-full rounded-[14px]"
                  />
                  <View className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white">
                    <Ionicons
                      name="heart-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View className="absolute left-2 top-2 rounded-full bg-white/90 px-3 py-1">
                    <Text className="text-[12px] font-bold text-text">
                      {k.time}
                    </Text>
                  </View>
                </View>
                <View className="px-2 py-3">
                  <Text className="text-[18px] font-black text-text">
                    {k.name}
                  </Text>
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text className="ml-1 text-[12px] font-bold text-text">
                      {k.rating} ({k.orders})
                    </Text>
                  </View>
                  <Text className="mt-2 text-[13px] font-semibold text-textSecondary">
                    {k.type}
                  </Text>
                  <View className="mt-2 flex-row flex-wrap">
                    {k.tags.map((tag) => (
                      <Text
                        key={tag}
                        className="mr-2 rounded-full bg-gray px-2 py-1 text-[11px] font-bold text-textSecondary"
                      >
                        {tag}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="px-4">
          <Text className="text-[26px] font-black text-text">
            What’s on your mind?
          </Text>
          <View className="mt-3 flex-row flex-wrap">
            {foodTypes.map((food, index) => (
              <Pressable
                key={food.name}
                className="mr-3 mb-3 w-[95px] items-center"
              >
                <Image
                  source={{ uri: food.image }}
                  className="h-[70px] w-[70px] rounded-[16px]"
                />
                <Text className="mt-2 text-[13px] font-bold text-text">
                  {food.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4 px-4">
          <Text className="text-[26px] font-black text-text">
            Why Choose Us?
          </Text>
          <View className="mt-3 flex-row flex-wrap justify-between">
            {[
              { title: "Homemade Food", icon: "leaf" },
              { title: "Hygienic & Safe", icon: "shield-checkmark" },
              { title: "Support Local Chefs", icon: "heart" },
              { title: "Fast Delivery", icon: "time" },
            ].map((item) => (
              <View
                key={item.title}
                className="mb-3 w-[48%] flex-row items-center rounded-[14px] border border-border bg-white px-4 py-4"
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={colors.primary}
                />
                <Text className="ml-2 text-[13px] font-bold text-text">
                  {item.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[26px] font-black text-text">
              Customer Reviews
            </Text>
            <Text className="text-[14px] font-bold text-primary">See all</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            {[
              {
                name: "Priya S.",
                comment:
                  "Amazing homemade food! Tastes just like home. Highly recommended!",
                stars: "★★★★☆",
              },
              {
                name: "Karthik R.",
                comment:
                  "Fresh and hygienic food. Loved the variety. Will order again!",
                stars: "★★★★☆",
              },
              {
                name: "Divya M.",
                comment:
                  "Good portion size and delicious taste. Affordable too!",
                stars: "★★★★☆",
              },
            ].map((r, idx) => (
              <View
                key={r.name}
                className="mr-4 w-[260px] rounded-[16px] border border-border bg-white p-4"
              >
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-gray">
                    <Text className="font-black text-primary">
                      {r.name.split(" ")[0].slice(0, 1)}
                    </Text>
                  </View>
                  <Text className="ml-3 text-[16px] font-black text-text">
                    {r.name}
                  </Text>
                </View>
                <Text className="mt-2 text-[12px] font-black text-warning">
                  {r.stars}
                </Text>
                <Text className="mt-2 text-[13px] font-medium text-textSecondary">
                  {r.comment}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="mt-4 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[26px] font-black text-text">
              Best Offers for You
            </Text>
            <Text className="text-[14px] font-bold text-primary">See all</Text>
          </View>
          <View className="flex-row">
            {[
              {
                title: "Combo Meals",
                text: "Starting at ₹99",
                button: "Order Now →",
              },
              {
                title: "Lunch Box",
                text: "Subscriptions 20% OFF",
                button: "Subscribe →",
              },
              {
                title: "Celebrate",
                text: "with Homemade Cakes",
                button: "Explore →",
              },
            ].map((offer, idx) => (
              <View
                key={offer.title}
                className="mr-3 w-[160px] rounded-[16px] border border-border bg-white p-3"
              >
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
                  }}
                  className="h-[90px] w-[120px] rounded-[14px]"
                />
                <Text className="mt-2 text-[16px] font-black text-text">
                  {offer.title}
                </Text>
                <Text className="text-[13px] font-bold text-textSecondary">
                  {offer.text}
                </Text>
                <Pressable className="mt-3 rounded-full bg-primary px-4 py-2">
                  <Text className="text-center text-[12px] font-black text-white">
                    {offer.button}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
