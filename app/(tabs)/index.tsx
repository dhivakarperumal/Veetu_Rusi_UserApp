import api from "@/app/api";
import AppHeader from "@/components/AppHeader";
import { colors } from "@/config/colors";
import { AuthContext } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useFetchLocation } from "@/hooks/useFetchLocation";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useContext, useEffect, useState } from "react";
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

const getFirstImageUrl = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = safeParse(trimmed);
    if (parsed.length > 0) {
      return getFirstImageUrl(parsed);
    }

    return trimmed.split(/\s+/)[0] || null;
  }

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === "string");
    if (typeof firstString === "string" && firstString.trim()) {
      return firstString.trim().split(/\s+/)[0] || null;
    }

    const objectImage = value.find(
      (item) => typeof item === "object" && item !== null,
    ) as { url?: string; image?: string; uri?: string } | undefined;

    if (objectImage?.url) return objectImage.url.trim();
    if (objectImage?.image) return objectImage.image.trim();
    if (objectImage?.uri) return objectImage.uri.trim();

    return null;
  }

  if (typeof value === "object") {
    const imageValue = value as { url?: string; image?: string; uri?: string };
    return (
      imageValue.url?.trim() ||
      imageValue.image?.trim() ||
      imageValue.uri?.trim() ||
      null
    );
  }

  return null;
};

const getCategoryImageUrl = (category: CategoryItem) => {
  const raw =
    category.image ?? category.images ?? category.image_url ?? category.photo;
  return getFirstImageUrl(raw) || null;
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

const parseJsonField = (value: unknown) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return [String(value)];
  }
};

const getFoodImage = (item: Record<string, any>) => {
  const rawImages =
    item.images ?? item.image ?? item.images_url ?? item.image_url;
  const images = parseJsonField(rawImages);
  if (Array.isArray(images) && images.length > 0 && images[0]) {
    return String(images[0]);
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.c_name || "Chef Food")}&background=random&size=600`;
};

const getStatusClasses = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "low stock":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "out of stock":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
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
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;

  const { fetchingLocation, fetchLocation } = useFetchLocation();

  const [categories, setCategories] = useState<CategoryItem[]>(
    categoriesCache || [],
  );
  const [foods, setFoods] = useState<any[]>([]);
  const [homeChefs, setHomeChefs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(
    !categoriesCache || categoriesCache.length === 0,
  );
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodsError, setFoodsError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

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

  const fetchFoods = useCallback(async () => {
    setFoodsLoading(true);
    setFoodsError(null);
    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const hasLocation = Boolean(user?.latitude && user?.longitude);
      const [foodsRes, productsRes, reviewsRes] = await Promise.all([
        api.get("/chef-foods"),
        api.get("/products", {
          params: { source: "chef_products" },
        }),
        api.get("/reviews").catch(() => ({ data: { reviews: [] } })),
      ]);

      const foodsFromApi = Array.isArray(foodsRes.data) ? foodsRes.data : [];
      const productsFromApi = Array.isArray(productsRes.data)
        ? productsRes.data
        : [];

      const reviewItems = Array.isArray(reviewsRes?.data?.reviews)
        ? reviewsRes.data.reviews
        : Array.isArray(reviewsRes?.data)
          ? reviewsRes.data
          : [];

      const allItems = [...foodsFromApi, ...productsFromApi];

      const homeChefMap = new Map<string, Record<string, any>>();
      allItems.forEach((item: Record<string, any>) => {
        if ((item.status || "").toLowerCase() !== "active") return;

        const rawChefName =
          item.chef_name ||
          item.homeChefName ||
          item.vendor_name ||
          item.chef ||
          item.homeChef ||
          item.provider_name ||
          item.name ||
          "Home Chef";

        const chefName = String(rawChefName).trim();
        if (!chefName || homeChefMap.has(chefName)) return;

        homeChefMap.set(chefName, {
          id:
            item.chef_id ||
            item.home_chef_id ||
            item.vendor_id ||
            item.id ||
            chefName,
          name: chefName,
          image: getFoodImage(item),
          location:
            item.location_name ||
            item.area_name ||
            item.area ||
            item.city ||
            item.district ||
            item.state ||
            item.pincode ||
            "Chennai, TN",
          rating:
            item.rating ||
            item.average_rating ||
            item.stars ||
            item.review_rating ||
            "4.8",
        });
      });

      setHomeChefs(Array.from(homeChefMap.values()));

      const filtered = allItems.filter((item: Record<string, any>) => {
        if ((item.status || "").toLowerCase() !== "active") return false;

        if (!hasLocation || !item.latitude || !item.longitude) return true;

        const distance = parseFloat(
          calculateDistance(
            Number(user.latitude),
            Number(user.longitude),
            Number(item.latitude),
            Number(item.longitude),
          ) || "0",
        );

        const radius = parseFloat(item.delivery_radius || 0);
        return distance <= radius;
      });

      setFoods(filtered);
      setReviews(
        reviewItems.filter(
          (item: Record<string, any>) => item?.comment || item?.rating,
        ),
      );
    } catch (error) {
      console.error("Error fetching chef foods:", error);
      setFoodsError("Unable to load items.");
      setFoods([]);
      setHomeChefs([]);
      setReviews([]);
      setReviewsError("Unable to load reviews.");
    } finally {
      setFoodsLoading(false);
      setReviewsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, [fetchCategories, fetchFoods]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <AppHeader title="Veetu Rusi" />

      {/* Location Bar - Home screen only */}
      <Pressable
        className="flex-row items-center justify-between border-b border-borderLight bg-white px-4 py-2.5"
        onPress={() => fetchLocation()}
        disabled={fetchingLocation}
      >
        <View className="flex-row items-center flex-1">
          <Ionicons name="location" size={18} color={colors.primary} />
          <View className="ml-2 flex-1">
            <Text className="text-[11px] font-semibold text-textSecondary">
              Delivering to
            </Text>
            <Text className="text-[14px] font-bold text-text" numberOfLines={1}>
              {user?.location_name ||
                (user?.area && user?.district
                  ? `${user.area}, ${user.district}`
                  : user?.area ||
                    user?.district ||
                    user?.pincode ||
                    "Set your location")}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.textSecondary}
          />
        </View>
        {fetchingLocation ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            className="ml-2"
          />
        ) : (
          <View className="ml-2 rounded-full bg-primary/10 px-3 py-1">
            <Text className="text-[12px] font-bold text-primary">Refresh</Text>
          </View>
        )}
      </Pressable>

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

        {homeChefs.length > 0 && (
          <View className="mt-5 px-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[27px] font-black text-text">
                Top Home Chefs
              </Text>
              <Text className="text-[14px] font-bold text-primary">
                See all
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {homeChefs.map((chef: Record<string, any>, idx: number) => (
                <View
                  key={chef.id || chef.name || idx}
                  className="mr-3 w-[160px] overflow-hidden rounded-[16px] border border-border bg-white p-2 shadow-sm shadow-black/5"
                >
                  <View className="items-center">
                    <Image
                      source={{ uri: chef.image }}
                      className="h-[120px] w-[120px] rounded-full border-2 border-primary"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="mt-2 items-center">
                    <Text
                      className="text-[15px] font-black text-text"
                      numberOfLines={1}
                    >
                      {chef.name}
                    </Text>
                    <Text
                      className="mt-1 text-[12px] font-semibold text-textSecondary"
                      numberOfLines={1}
                    >
                      {chef.location}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <Ionicons name="star" size={14} color={colors.warning} />
                      <Text className="ml-1 text-[12px] font-black text-text">
                        {String(chef.rating || "4.8")}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="mx-4 mt-4 flex-row flex-wrap items-center justify-between">
          {loading ? (
            <View className="mb-3 h-[72px] w-full items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : categories.length > 0 ? (
            categories.slice(0, 8).map((c, index) => {
              const categoryImage = getCategoryImageUrl(c);
              const categoryName = c.name || c.c_name || "Food";

              return (
                <Pressable
                  key={categoryName || String(index)}
                  className="mb-3 h-[72px] w-[24%] items-center justify-center"
                >
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                    {categoryImage ? (
                      <Image
                        source={{ uri: categoryImage }}
                        className="h-11 w-11 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name={
                          getIconByCategory(
                            categoryName,
                          ) as keyof typeof Ionicons.glyphMap
                        }
                        size={22}
                        color={
                          index % 2 === 0 ? colors.primary : colors.secondary
                        }
                      />
                    )}
                  </View>
                  <Text className="mt-2 text-center text-[11px] font-semibold text-text">
                    {categoryName}
                  </Text>
                </Pressable>
              );
            })
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

          {foodsLoading ? (
            <View className="mb-4 h-[160px] items-center justify-center rounded-2xl bg-white">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : foodsError ? (
            <View className="mb-4 rounded-2xl bg-white px-4 py-4">
              <Text className="font-semibold text-error">{foodsError}</Text>
            </View>
          ) : foods.length === 0 ? (
            <View className="mb-4 rounded-2xl bg-white px-4 py-8 items-center">
              <Ionicons
                name="restaurant-outline"
                size={40}
                color={colors.grayDark}
              />
              <Text className="mt-2 text-[14px] font-semibold text-textSecondary">
                No items available near you
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {foods.slice(0, 8).map((food: Record<string, any>, i) => {
                const image = getFoodImage(food);
                const mrp = Number(food.mrp || 0);
                const sellingPrice =
                  food.final_price && Number(food.final_price) > 0
                    ? Number(food.final_price)
                    : food.offer && Number(food.offer) > 0 && mrp
                      ? mrp - (mrp * Number(food.offer)) / 100
                      : mrp;

                return (
                  <View
                    key={food.id || food.name || i}
                    className="mr-4 w-[200px] rounded-[18px] border border-border bg-white overflow-hidden"
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: image }}
                        className="h-[130px] w-full"
                        resizeMode="cover"
                      />
                      <Pressable className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                        <Ionicons
                          name="heart-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </Pressable>
                      {Number(food.offer) > 0 && (
                        <View className="absolute left-0 top-0 rounded-br-xl bg-primary px-2.5 py-1">
                          <Text className="text-[11px] font-black text-white">
                            {food.offer}% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="p-3">
                      <Text
                        className="text-[15px] font-black text-text"
                        numberOfLines={1}
                      >
                        {food.name || food.c_name || "Chef Food"}
                      </Text>
                      <Text
                        className="mt-0.5 text-[12px] font-medium text-textSecondary"
                        numberOfLines={1}
                      >
                        {food.category || food.category_type || "Home Food"}
                      </Text>
                      <View className="mt-2 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[16px] font-black text-primary">
                            ₹{Math.round(sellingPrice)}
                          </Text>
                          {Number(food.offer) > 0 && mrp > 0 && (
                            <Text className="text-[11px] text-textSecondary line-through">
                              ₹{Math.round(mrp)}
                            </Text>
                          )}
                        </View>
                        <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <Ionicons name="add" size={20} color="white" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
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

          {reviewsLoading ? (
            <View className="mb-4 h-[120px] items-center justify-center rounded-2xl bg-white">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : reviewsError ? (
            <View className="mb-4 rounded-2xl bg-white px-4 py-4">
              <Text className="font-semibold text-error">{reviewsError}</Text>
            </View>
          ) : reviews.length === 0 ? (
            <View className="mb-4 rounded-2xl bg-white px-4 py-4">
              <Text className="font-semibold text-textSecondary">
                No customer reviews yet.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              {reviews
                .slice(0, 8)
                .map((r: Record<string, any>, idx: number) => {
                  const stars = Array.from({ length: 5 }, (_, i) =>
                    i < Number(r.rating || 0) ? "★" : "☆",
                  ).join("");
                  const reviewer = String(
                    r.user_name || r.user_email || "Verified Customer",
                  );

                  return (
                    <View
                      key={r.id || `${reviewer}-${idx}`}
                      className="mr-4 w-[260px] rounded-[16px] border border-border bg-white p-4"
                    >
                      <View className="flex-row items-center">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-gray">
                          <Text className="font-black text-primary">
                            {reviewer.split(" ")[0].slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="ml-3 text-[16px] font-black text-text">
                          {reviewer}
                        </Text>
                      </View>
                      <Text className="mt-2 text-[12px] font-black text-warning">
                        {stars}
                      </Text>
                      <Text className="mt-2 text-[13px] font-medium text-textSecondary">
                        {r.comment || "Good food experience."}
                      </Text>
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </View>

        {/* Best Offers for You — real data filtered by offer > 0 */}
        <View className="mt-4 px-4 pb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[26px] font-black text-text">
              Best Offers for You
            </Text>
            <Text className="text-[14px] font-bold text-primary">See all</Text>
          </View>
          {foodsLoading ? (
            <View className="h-[160px] items-center justify-center rounded-2xl bg-white">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(foods.filter((f) => Number(f.offer) > 0).length > 0
                ? foods.filter((f) => Number(f.offer) > 0)
                : foods
              )
                .slice(0, 8)
                .map((food: Record<string, any>, i) => {
                  const image = getFoodImage(food);
                  const mrp = Number(food.mrp || 0);
                  const hasOffer = Number(food.offer) > 0;
                  const discountedPrice =
                    food.final_price && Number(food.final_price) > 0
                      ? Number(food.final_price)
                      : hasOffer && mrp
                        ? mrp - (mrp * Number(food.offer)) / 100
                        : mrp;

                  return (
                    <View
                      key={food.id || i}
                      className="mr-3 w-[170px] overflow-hidden rounded-[16px] border border-border bg-white"
                    >
                      <View className="relative">
                        <Image
                          source={{ uri: image }}
                          className="h-[105px] w-full"
                          resizeMode="cover"
                        />
                        {hasOffer && (
                          <View className="absolute left-0 top-0 rounded-br-xl bg-primary px-3 py-1">
                            <Text className="text-[12px] font-black text-white">
                              {food.offer}% OFF
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="p-2.5">
                        <Text
                          className="text-[14px] font-black text-text"
                          numberOfLines={1}
                        >
                          {food.name || food.c_name || "Chef Food"}
                        </Text>
                        <Text
                          className="mt-0.5 text-[12px] text-textSecondary"
                          numberOfLines={1}
                        >
                          {food.category || food.category_type || "Home Food"}
                        </Text>
                        <View className="mt-2 flex-row items-center justify-between">
                          <View>
                            <Text className="text-[15px] font-black text-primary">
                              ₹{Math.round(discountedPrice)}
                            </Text>
                            {hasOffer && mrp > 0 && (
                              <Text className="text-[11px] text-textSecondary line-through">
                                ₹{Math.round(mrp)}
                              </Text>
                            )}
                          </View>
                          <Pressable className="rounded-full bg-primary px-3 py-1.5">
                            <Text className="text-[11px] font-black text-white">
                              Add
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
