import api from "@/app/api";
import AppHeader from "@/components/AppHeader";
import QuickViewModal from "@/components/QuickViewModal";
import { colors } from "@/config/colors";
import { useLocation } from "@/context/LocationContext";
import { Product, useStore } from "@/context/StoreContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
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
  const { width: windowWidth } = useWindowDimensions();
  const heroWidth = windowWidth - 32;
  const heroScrollRef = useRef<ScrollView>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const router = useRouter();
  const { categoriesCache, setCategoriesCache } = useStore();
  const {
    location,
    hasLocation,
    fetchingLocation,
    fetchLocation,
    isProductDeliverable,
  } = useLocation();

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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const autoplay = setInterval(() => {
      const nextSlide = (heroSlide + 1) % 3;
      setHeroSlide(nextSlide);
      heroScrollRef.current?.scrollTo({
        x: nextSlide * heroWidth,
        animated: true,
      });
    }, 5000);

    return () => clearInterval(autoplay);
  }, [heroSlide, heroWidth]);

  const fetchCategories = useCallback(
    async (force = false) => {
      try {
        if (!force && categoriesCache && categoriesCache.length > 0) {
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
        if (!categories.length) setCategories([]);
      } finally {
        setLoading(false);
      }
    },
    [categoriesCache, categories.length, setCategoriesCache],
  );

  const fetchFoods = useCallback(async () => {
    setFoodsLoading(true);
    setFoodsError(null);
    setReviewsLoading(true);
    setReviewsError(null);

    try {
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

      // Filter products according to the fetched location
      const filtered = allItems.filter((item: Record<string, any>) => {
        return isProductDeliverable(item, location);
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
  }, [location, isProductDeliverable]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!isMounted) return;
      await fetchCategories();
      if (!isMounted) return;
      await fetchFoods();
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchCategories, fetchFoods]);

  // Pull to refresh: Refreshes data without changing/resetting location
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchCategories(true), fetchFoods()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories, fetchFoods, location]);

  // Change Location: Explicitly fetches current GPS location and updates products
  const handleChangeLocation = () => {
    fetchLocation((newLoc) => {
      fetchFoods();
    });
  };

  // Products with offers deliverable to the current location
  const offerFoods = foods.filter((item) => {
    const offer = Number(item.offer || 0);
    const offerPrice = Number(item.offer_price || 0);
    const mrp = Number(item.mrp || 0);
    return offer > 0 || (offerPrice > 0 && offerPrice < mrp);
  });

  const displayLocation =
    location?.locationName ||
    (location?.area && location?.district
      ? `${location.area}, ${location.district}`
      : location?.area ||
        location?.district ||
        location?.city ||
        location?.pincode ||
        "Set your location");

  const visibleCategories =
    categories.length > 0
      ? categories.slice(0, 8).map((category, index) => ({
          key: category.name || category.c_name || String(index),
          name: category.name || category.c_name || "Food",
          image: getCategoryImageUrl(category),
          icon: getIconByCategory(category.name || category.c_name || "Food"),
          index,
        }))
      : staticCategories.map((category, index) => ({
          key: category.label,
          name: category.label,
          image: "",
          icon: category.icon,
          index,
        }));

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <AppHeader title="Home" />

      {/* Location Bar with explicit Change Location button */}
      <View className="flex-row items-center justify-between border-b border-borderLight bg-white px-4 py-2.5">
        <Pressable
          className="mr-2 flex-1 flex-row items-center"
          onPress={handleChangeLocation}
          disabled={fetchingLocation}
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="location" size={18} color={colors.primary} />
          </View>
          <View className="ml-2.5 flex-1">
            <Text className="text-[11px] font-semibold text-textSecondary">
              Delivering to
            </Text>
            <Text className="text-[14px] font-bold text-text" numberOfLines={1}>
              {location?.locationName ||
                (location?.area && location?.district
                  ? `${location.area}, ${location.district}`
                  : location?.area ||
                    location?.district ||
                    location?.pincode ||
                    "Set your location")}
            </Text>
          </View>
        </Pressable>

        <Pressable
          className="flex-row items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 active:opacity-70"
          onPress={handleChangeLocation}
          disabled={fetchingLocation}
        >
          {fetchingLocation ? (
            <>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                className="mr-1.5"
              />
              <Text className="text-[12px] font-bold text-primary">
                Fetching...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="locate"
                size={14}
                color={colors.primary}
                className="mr-1"
              />
              <Text className="text-[12px] font-bold text-primary">
                {hasLocation ? "Change Location" : "Fetch Location"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-[#f8f8f7]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <View className="px-4 py-3">
          <View className="flex-row items-center rounded-xl border border-borderLight bg-white px-4 py-3">
            <Ionicons name="search-outline" size={22} color={colors.grayDark} />
            <TextInput
              placeholder="Search for meals, chefs, cuisines..."
              placeholderTextColor={colors.grayDark}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  router.push({
                    pathname: "/(tabs)/food" as any,
                    params: { search: searchQuery.trim() },
                  });
                }
              }}
              className="ml-2 flex-1 text-[14px]"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.grayDark}
                />
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="Open filters"
                hitSlop={8}
                onPress={() => setFilterSheetVisible(true)}
              >
                <Ionicons name="filter" size={22} color={colors.grayDark} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Hero Banner */}
        <View className="mx-4 mb-3 h-[190px] overflow-hidden rounded-[22px]">
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              setHeroSlide(
                Math.round(event.nativeEvent.contentOffset.x / heroWidth),
              );
            }}
          >
            <View style={{ width: heroWidth }} className="h-[190px]">
              <ImageBackground
                source={require("../../assets/images/hero bg.png")}
                resizeMode="cover"
                className="h-full w-full"
              />
              <Pressable
                className="absolute bottom-5 left-3 flex-row items-center rounded-full bg-primary px-4 py-2.5 shadow-sm shadow-black active:opacity-80"
                onPress={() => router.push("/(tabs)/food")}
              >
                <Text className="text-[13px] font-black text-white">
                  Order Now
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.white}
                  className="ml-1.5"
                />
              </Pressable>
            </View>
            <Image
              source={require("../../assets/images/offer banner.png")}
              resizeMode="cover"
              style={{ width: heroWidth, height: 190 }}
            />
            <Image
              source={require("../../assets/images/this banner.png")}
              resizeMode="cover"
              style={{ width: heroWidth, height: 190 }}
            />
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View className="mx-4 mt-5 mb-1">
          <Text className="text-[26px] font-black text-text">Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mx-4 mt-4"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {loading ? (
            <View className="h-[148px] w-full items-center justify-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            Array.from({ length: Math.ceil(visibleCategories.length / 2) }).map(
              (_, columnIndex) => (
                <View key={`category-column-${columnIndex}`} className="mr-3">
                  {visibleCategories
                    .slice(columnIndex * 2, columnIndex * 2 + 2)
                    .map((category) => (
                      <Pressable
                        key={category.key}
                        className="mb-2 h-[82px] w-[96px] items-center justify-center"
                        onPress={() => {
                          router.push({
                            pathname: "/(tabs)/food" as any,
                            params: { category: category.name },
                          });
                        }}
                      >
                        <View className="h-18 w-18 items-center justify-center rounded-full border border-primary/25 bg-white p-1 shadow-sm">
                          {category.image ? (
                            <Image
                              source={{ uri: category.image }}
                              className="h-16 w-16 rounded-full border border-primary/20"
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons
                              name={
                                category.icon as keyof typeof Ionicons.glyphMap
                              }
                              size={22}
                              color={
                                category.index % 2 === 0
                                  ? colors.primary
                                  : colors.secondary
                              }
                            />
                          )}
                        </View>
                        <Text
                          className="mt-2 text-center text-[11px] font-semibold text-text"
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    ))}
                </View>
              ),
            )
          )}
        </ScrollView>

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

        {/* Promo Banner */}
        <ImageBackground
          source={require("../../assets/images/offer banner.png")}
          resizeMode="cover"
          className="mx-4 mt-1 h-[190px] overflow-hidden rounded-[20px]"
        />

        {/* Section 1: Popular Near You (Filtered by fetched location) */}
        <View className="mt-5 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[26px] font-black text-text">
                Popular Near You
              </Text>
              {hasLocation && (
                <Text className="text-[12px] font-semibold text-textSecondary">
                  Deliverable to{" "}
                  {location?.area || location?.city || "your area"}
                </Text>
              )}
            </View>
            <Pressable onPress={() => router.push("/(tabs)/food")}>
              <Text className="text-[14px] font-bold text-primary">
                See all
              </Text>
            </Pressable>
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
            <View className="mb-4 items-center justify-center rounded-2xl border border-borderLight bg-white p-6">
              <Ionicons
                name="restaurant-outline"
                size={36}
                color={colors.grayDark}
              />
              <Text className="mt-2 text-[15px] font-bold text-text">
                No food items deliverable to this area yet
              </Text>
              <Text className="mt-1 text-center text-[12px] text-textSecondary">
                Try changing your location or view all items in the food menu.
              </Text>
              <Pressable
                onPress={handleChangeLocation}
                className="mt-3 rounded-full bg-primary px-4 py-2"
              >
                <Text className="text-xs font-bold text-white">
                  Change Location
                </Text>
              </Pressable>
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

                const productId = food.id || food._id;

                return (
                  <Pressable
                    key={productId || food.name || i}
                    onPress={() => {
                      setSelectedProduct(food as Product);
                    }}
                    className="mr-3 w-[154px] rounded-[16px] border border-border bg-white p-2.5"
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: image }}
                        className="h-[86px] w-full rounded-[12px]"
                        resizeMode="cover"
                      />
                      <Pressable className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
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
                    <View>
                      <Text
                        className="text-[15px] font-black text-text"
                        numberOfLines={1}
                      >
                        {food.name || food.c_name || "Chef Food"}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <Ionicons
                          name="star"
                          size={14}
                          color={colors.warning}
                        />
                        <Text className="ml-1 text-[12px] font-bold text-text">
                          {food.rating ?? "4.8"} ({food.orders ?? "1.2K"})
                        </Text>
                      </View>
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
                        <Pressable
                          className="h-8 w-8 items-center justify-center rounded-full bg-primary"
                          onPress={(event) => {
                            event.stopPropagation();
                            setSelectedProduct(food as Product);
                          }}
                        >
                          <Ionicons name="add" size={20} color="white" />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Section 2: What's on your mind? */}
        <View className="px-4">
          <Text className="text-[26px] font-black text-text">
            What’s on your mind?
          </Text>
          <View className="mt-3 flex-row flex-wrap justify-between">
            {foodTypes.map((food) => (
              <Pressable
                key={food.name}
                className="mb-3 w-[31%] items-center"
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/food" as any,
                    params: { search: food.name },
                  });
                }}
              >
                <Image
                  source={{ uri: food.image }}
                  className="h-[88px] w-[88px] rounded-[16px] border border-primary/20 bg-white p-1 shadow-sm"
                />
                <Text className="mt-2 text-[13px] font-bold text-text">
                  {food.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Section 3: Why Choose Us? */}
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

        <ImageBackground
          source={require("../../assets/images/this banner.png")}
          resizeMode="cover"
          className="mx-4 mt-4 h-[190px] overflow-hidden rounded-[20px]"
        />

        {/* Section 4: Customer Reviews */}
        <View className="mt-4 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[26px] font-black text-text">
              Customer Reviews
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/food")}>
              <Text className="text-[14px] font-bold text-primary">
                See all
              </Text>
            </Pressable>
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

        {/* Section 5: Best Offers for You (Filtered by fetched location) */}
        <View className="mt-4 px-4 pb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[26px] font-black text-text">
              Best Offers for You
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/food" as any,
                  params: { offer: "10" },
                })
              }
            >
              <Text className="text-[14px] font-bold text-primary">
                See all
              </Text>
            </Pressable>
          </View>

          {offerFoods.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {offerFoods.slice(0, 6).map((offerItem, idx) => {
                const image = getFoodImage(offerItem);
                const discount =
                  Number(offerItem.offer || 0) > 0
                    ? `${offerItem.offer}% OFF`
                    : "Special Offer";
                const price =
                  offerItem.final_price ??
                  offerItem.offer_price ??
                  offerItem.mrp ??
                  0;
                const origPrice = Number(offerItem.mrp || 0);
                const productId = offerItem.id || offerItem._id;

                return (
                  <Pressable
                    key={productId || idx}
                    onPress={() => {
                      setSelectedProduct(offerItem);
                    }}
                    className="mr-3 w-[154px] overflow-hidden rounded-[16px] border border-border bg-white"
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: image }}
                        className="h-[112px] w-full"
                        resizeMode="cover"
                      />
                      <View className="absolute left-0 top-0 rounded-br-xl bg-primary px-2 py-1">
                        <Text className="text-[10px] font-bold text-white">
                          {discount}
                        </Text>
                      </View>
                      <Pressable className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm">
                        <Ionicons
                          name="heart-outline"
                          size={17}
                          color={colors.primary}
                        />
                      </Pressable>
                    </View>
                    <View className="p-2.5">
                      <Text
                        className="text-[15px] font-black text-text"
                        numberOfLines={1}
                      >
                        {offerItem.name || offerItem.c_name || "Offer Item"}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <Ionicons
                          name="star"
                          size={14}
                          color={colors.warning}
                        />
                        <Text className="ml-1 text-[12px] font-bold text-text">
                          {offerItem.rating ?? "4.8"} (
                          {offerItem.orders ?? "1.2K"})
                        </Text>
                      </View>
                      <Text
                        className="mt-0.5 text-[12px] font-medium text-textSecondary"
                        numberOfLines={1}
                      >
                        {offerItem.category ||
                          offerItem.category_type ||
                          "Sea Food"}
                      </Text>
                      <View className="mt-2 flex-row items-center justify-between">
                        <View>
                          <Text className="text-[16px] font-black text-primary">
                            ₹{Math.round(Number(price))}
                          </Text>
                          {origPrice > Number(price) && (
                            <Text className="text-[11px] text-textSecondary line-through">
                              ₹{origPrice}
                            </Text>
                          )}
                        </View>
                        <Pressable
                          className="h-7 w-7 items-center justify-center rounded-full bg-primary"
                          onPress={(event) => {
                            event.stopPropagation();
                            setSelectedProduct(offerItem);
                          }}
                        >
                          <Ionicons name="add" size={19} color="white" />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View className="flex-row">
              {[
                {
                  title: "Combo Meals",
                  text: "Starting at ₹99",
                  button: "Order Now →",
                  category: "Combos",
                },
                {
                  title: "Lunch Box",
                  text: "Subscriptions 20% OFF",
                  button: "Subscribe →",
                  category: "Lunch Box",
                },
                {
                  title: "Healthy Choice",
                  text: "Fresh Homemade Diet",
                  button: "Explore →",
                  category: "Healthy",
                },
              ].map((offer) => (
                <Pressable
                  key={offer.title}
                  className="mr-3 w-[154px] overflow-hidden rounded-[16px] border border-border bg-white"
                  onPress={() => {
                    router.push({
                      pathname: "/(tabs)/food" as any,
                      params: { category: offer.category },
                    });
                  }}
                >
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80",
                    }}
                    className="h-[112px] w-full"
                  />
                  <View className="absolute left-0 top-0 rounded-br-xl bg-primary px-2 py-1">
                    <Text className="text-[10px] font-bold text-white">
                      OFFER
                    </Text>
                  </View>
                  <View className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm">
                    <Ionicons
                      name="heart-outline"
                      size={17}
                      color={colors.primary}
                    />
                  </View>
                  <View className="p-2.5">
                    <Text
                      className="text-[15px] font-black text-text"
                      numberOfLines={1}
                    >
                      {offer.title}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <Ionicons name="star" size={14} color={colors.warning} />
                      <Text className="ml-1 text-[12px] font-bold text-text">
                        4.8 (1.2K)
                      </Text>
                    </View>
                    <Text
                      className="mt-0.5 text-[12px] font-medium text-textSecondary"
                      numberOfLines={1}
                    >
                      {offer.category}
                    </Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-[16px] font-black text-primary">
                        {offer.text}
                      </Text>
                      <Pressable className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                        <Ionicons name="add" size={19} color="white" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <QuickViewModal
        product={selectedProduct}
        visible={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
      />

      <Modal
        visible={filterSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-[28px] bg-white px-5 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[20px] font-black text-text">
                  Filter Food
                </Text>
                <Text className="mt-1 text-[12px] text-textSecondary">
                  Choose a category to explore
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close filters"
                hitSlop={10}
                onPress={() => setFilterSheetVisible(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={colors.grayDark}
                />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {[
                { label: "All Food", icon: "restaurant-outline", params: {} },
                {
                  label: "Meals",
                  icon: "fast-food-outline",
                  params: { category: "Meals" },
                },
                {
                  label: "Tiffin",
                  icon: "cafe-outline",
                  params: { category: "Tiffin" },
                },
                {
                  label: "Snacks",
                  icon: "ice-cream-outline",
                  params: { category: "Snacks" },
                },
                {
                  label: "Healthy",
                  icon: "leaf-outline",
                  params: { category: "Healthy" },
                },
                {
                  label: "Offers",
                  icon: "pricetag-outline",
                  params: { offer: "10" },
                },
              ].map((filter) => (
                <Pressable
                  key={filter.label}
                  className="mb-3 w-[31%] items-center rounded-2xl border border-borderLight bg-[#fffaf5] px-2 py-3 active:bg-primary/10"
                  onPress={() => {
                    setFilterSheetVisible(false);
                    router.push({
                      pathname: "/(tabs)/food" as any,
                      params: filter.params,
                    });
                  }}
                >
                  <Ionicons
                    name={filter.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={colors.primary}
                  />
                  <Text className="mt-2 text-center text-[12px] font-bold text-text">
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
