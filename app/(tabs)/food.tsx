import api from "@/app/api";
import AppHeader from "@/components/AppHeader";
import ProductCard from "@/components/ProductCard";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { useLocation, UserLocation } from "@/context/LocationContext";
import { Product, useStore } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Category {
  c_name: string;
  category_type: string;
  name?: string;
  [key: string]: any;
}

export default function FoodScreen({
  defaultCategory = "",
}: {
  defaultCategory?: string;
}) {
  const params = useLocalSearchParams<{
    category?: string;
    search?: string;
    offer?: string;
  }>();
  const { user } = useAuth();
  const {
    location,
    hasLocation,
    fetchingLocation,
    fetchLocation,
    isProductDeliverable,
  } = useLocation();
  const {
    chefFoodsCache,
    setChefFoodsCache,
    lastChefFoodsFetchTime,
    setLastChefFoodsFetchTime,
  } = useStore();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [loading, setLoading] = useState(
    !chefFoodsCache || chefFoodsCache.length === 0,
  );
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(
    defaultCategory ? true : false,
  );

  // Filter State
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("10000");
  const [offerFilter, setOfferFilter] = useState(0);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortOption, setSortOption] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Other state
  const [groupedCategories, setGroupedCategories] = useState<
    Record<string, Category[]>
  >({});
  const [currentPage, setCurrentPage] = useState(1);

  // Sync route params when navigated from other screens
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (params.category) {
      setSelectedCategory(params.category);
    }
    if (params.search) {
      setSearch(params.search);
    }
    if (params.offer) {
      setOfferFilter(Number(params.offer));
      setShowFilters(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [params.category, params.search, params.offer]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/home-chef-categories");
        const allCats = Array.isArray(res.data) ? res.data : [];

        const grouped = allCats.reduce(
          (acc: Record<string, Category[]>, cat: Category) => {
            const type =
              cat.category_type?.toLowerCase() === "food" ? "Food" : "Products";

            if (!acc[type]) acc[type] = [];

            acc[type].push({
              ...cat,
              name: cat.c_name,
            });

            return acc;
          },
          {},
        );

        setGroupedCategories(grouped);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(
    async (forceRefresh = false, locationOverride?: UserLocation | null) => {
      const activeLoc =
        locationOverride !== undefined ? locationOverride : location;
      const isCacheValid =
        !forceRefresh &&
        lastChefFoodsFetchTime &&
        Date.now() - lastChefFoodsFetchTime < 5 * 60 * 1000;

      if (isCacheValid && chefFoodsCache?.length > 0) {
        const myProducts = chefFoodsCache.filter((product) =>
          isProductDeliverable(product, activeLoc),
        );

        setProducts(myProducts);
        setFilteredProducts(myProducts);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [foodsRes, productsRes] = await Promise.all([
          api.get("/chef-foods").catch((err) => {
            console.error(err);
            return { data: [] };
          }),
          api
            .get("/products", { params: { source: "chef_products" } })
            .catch((err) => {
              console.error(err);
              return { data: [] };
            }),
        ]);

        const foodsData = Array.isArray(foodsRes.data) ? foodsRes.data : [];
        const productsData = Array.isArray(productsRes.data)
          ? productsRes.data
          : [];
        const data = [...foodsData, ...productsData];

        setChefFoodsCache(data);
        setLastChefFoodsFetchTime(Date.now());

        const myProducts = data.filter((product) =>
          isProductDeliverable(product, activeLoc),
        );

        setProducts(myProducts);
        setFilteredProducts(myProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [
      location,
      chefFoodsCache,
      lastChefFoodsFetchTime,
      isProductDeliverable,
      setChefFoodsCache,
      setLastChefFoodsFetchTime,
    ],
  );

  // Initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  // Pull to refresh without resetting location
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProducts(true, location);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts, location]);

  // Apply filters and sorting
  useEffect(() => {
    let updated = [...products];

    // Search filter
    if (search) {
      updated = updated.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Type filter
    if (selectedType) {
      const categoriesForType = new Set(
        (groupedCategories[selectedType] || [])
          .map((cat) => cat.name?.trim().toLowerCase())
          .filter(Boolean),
      );
      if (categoriesForType.size > 0) {
        updated = updated.filter((p) =>
          categoriesForType.has(p.category?.trim().toLowerCase()),
        );
      }
    }

    // Category filter
    if (selectedCategory) {
      const normalizedSelectedCategory = decodeURIComponent(selectedCategory)
        .trim()
        .toLowerCase();

      updated = updated.filter((p) => {
        const productCategory = p.category
          ? p.category.trim().toLowerCase()
          : "";
        return productCategory === normalizedSelectedCategory;
      });
    }

    // SubCategory filter
    if (selectedSubCategory) {
      updated = updated.filter((p) => p.subcategory === selectedSubCategory);
    }

    // Color filter
    if (selectedColor) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.colorName === selectedColor),
      );
    }

    // Size filter
    if (selectedSize) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.selectedSizes?.includes(selectedSize)),
      );
    }

    // Price range filter
    const minimumPriceValue = minimumPrice ? Number(minimumPrice) : 0;
    const maximumPriceValue = maximumPrice
      ? Number(maximumPrice)
      : Number.POSITIVE_INFINITY;
    updated = updated.filter((p) => {
      const productPrice = Number(p.final_price ?? p.offer_price ?? p.mrp ?? 0);
      return (
        productPrice >= minimumPriceValue && productPrice <= maximumPriceValue
      );
    });

    // Offer filter
    if (offerFilter) {
      updated = updated.filter((p) => Number(p.offer || 0) >= offerFilter);
    }

    // Rating filter
    if (ratingFilter) {
      updated = updated.filter(
        (p) =>
          Number(p.rating ?? p.average_rating ?? p.star_rating ?? 0) >=
          ratingFilter,
      );
    }

    // Sorting
    if (sortOption === "az")
      updated.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortOption === "za")
      updated.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (sortOption === "priceLowHigh")
      updated.sort(
        (a, b) =>
          Number(a.final_price ?? a.offer_price ?? 0) -
          Number(b.final_price ?? b.offer_price ?? 0),
      );
    if (sortOption === "priceHighLow")
      updated.sort(
        (a, b) =>
          Number(b.final_price ?? b.offer_price ?? 0) -
          Number(a.final_price ?? a.offer_price ?? 0),
      );
    if (sortOption === "offerHighLow")
      updated.sort((a, b) => Number(b.offer || 0) - Number(a.offer || 0));
    if (sortOption === "offerLowHigh")
      updated.sort((a, b) => Number(a.offer || 0) - Number(b.offer || 0));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredProducts([...updated]);
    setCurrentPage(1);
  }, [
    search,
    selectedCategory,
    selectedSubCategory,
    selectedColor,
    selectedSize,
    minimumPrice,
    maximumPrice,
    offerFilter,
    ratingFilter,
    sortOption,
    products,
    selectedType,
    groupedCategories,
  ]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedType("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSelectedColor("");
    setSelectedSize("");
    setMinimumPrice("");
    setMaximumPrice("10000");
    setOfferFilter(0);
    setRatingFilter(0);
  };

  // Derived filter data
  const apiCategoryNames = Object.values(groupedCategories || {})
    .flat()
    .map((cat) => cat.name?.trim())
    .filter((name): name is string => Boolean(name));

  const categories: string[] = selectedType
    ? [
        ...new Set(
          (groupedCategories[selectedType] || [])
            .map((cat) => cat.name?.trim())
            .filter((name): name is string => Boolean(name)),
        ),
      ]
    : apiCategoryNames.length > 0
      ? [...new Set(apiCategoryNames)]
      : [
          ...new Set(
            products
              .map((p) => p.category)
              .filter((cat): cat is string => Boolean(cat))
              .map((cat) => cat.trim()),
          ),
        ];

  // Pagination
  const productsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-text">Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No location screen
  if (!loading && !hasLocation) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <ScrollView contentContainerClassName="grow items-center justify-center px-3">
          <View className="items-center rounded-2xl border border-borderLight bg-white p-5">
            <View className="mb-4 h-[60px] w-[60px] items-center justify-center rounded-full bg-primary/20">
              <MaterialCommunityIcons
                name="map-marker"
                size={48}
                color={colors.primary}
              />
            </View>

            <Text className="mb-2 text-center text-lg font-bold text-text">
              Fetch your location to see nearby home chef products
            </Text>

            <Text className="mb-4 text-center text-[13px] text-textSecondary">
              We use your location to find fresh, delicious home-cooked meals
              and authentic products available for delivery in your area.
            </Text>

            <TouchableOpacity
              className="mb-3 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3"
              onPress={() =>
                fetchLocation((newLoc) => {
                  fetchProducts(true, newLoc);
                })
              }
              disabled={fetchingLocation}
            >
              {fetchingLocation ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text className="text-sm font-semibold text-white">
                    Fetching Location...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="navigation"
                    size={20}
                    color={colors.white}
                  />
                  <Text className="text-sm font-semibold text-white">
                    Fetch Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-xs text-textSecondary">
              🔒 Allow location access in your app when prompted
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <AppHeader title="Food" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-3"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Location Badge */}
        <View className="mb-3 flex-row items-center justify-between rounded-xl border border-borderLight bg-white p-3">
          <View className="flex-1 flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={colors.primary}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-textSecondary">
                Delivery Location:
              </Text>
              <Text
                className="text-[13px] font-semibold text-text"
                numberOfLines={1}
              >
                {location?.locationName ||
                  (location?.area && location?.district
                    ? `${location.area}, ${location.district}`
                    : location?.area ||
                      location?.city ||
                      location?.pincode ||
                      "Current Location")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 active:opacity-70"
            onPress={() =>
              fetchLocation((newLoc) => {
                fetchProducts(true, newLoc);
              })
            }
            disabled={fetchingLocation}
          >
            {fetchingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={14}
                  color={colors.primary}
                />
                <Text className="text-xs font-bold text-primary">Change</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View className="mb-3 flex-row items-center gap-2.5">
          <View className="h-[52px] flex-1 flex-row items-center gap-2 rounded-xl border border-borderLight bg-white px-2.5">
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              className="flex-1 text-[13px] text-text"
              placeholder="Search products..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.textSecondary}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            className="h-[52px] flex-row items-center gap-1.5 rounded-xl bg-gray px-3"
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons
              name="filter"
              size={20}
              color={colors.text}
            />
            <Text className="text-[13px] font-semibold text-text">Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Options */}
        <View className="mb-3">
          <Text className="mb-2 text-xs font-semibold text-text">Sort By:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {[
              { label: "Default", value: "" },
              { label: "A – Z", value: "az" },
              { label: "Z – A", value: "za" },
              { label: "Low Price", value: "priceLowHigh" },
              { label: "High Price", value: "priceHighLow" },
              { label: "High Offer", value: "offerHighLow" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`rounded-lg border px-3 py-1.5 ${
                  sortOption === opt.value
                    ? "border-primary bg-primary"
                    : "border-borderLight bg-white"
                }`}
                onPress={() => setSortOption(opt.value)}
              >
                <Text
                  className={`text-xs font-medium ${
                    sortOption === opt.value ? "text-white" : "text-text"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count and View Mode */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs text-textSecondary">
            Showing{" "}
            <Text className="font-bold text-text">
              {filteredProducts.length}
            </Text>{" "}
            of <Text className="font-bold text-text">{products.length}</Text>{" "}
            products
          </Text>
          <View className="flex-row rounded-lg border border-borderLight bg-white p-1">
            <TouchableOpacity
              accessibilityLabel="Card view"
              onPress={() => setViewMode("card")}
              className={`flex-row items-center rounded-md px-2.5 py-1.5 ${
                viewMode === "card" ? "bg-primary" : ""
              }`}
            >
              <MaterialCommunityIcons
                name="view-grid-outline"
                size={16}
                color={viewMode === "card" ? colors.white : colors.text}
              />
              <Text
                className={`ml-1 text-[11px] font-bold ${
                  viewMode === "card" ? "text-white" : "text-text"
                }`}
              >
                Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Table view"
              onPress={() => setViewMode("table")}
              className={`ml-1 flex-row items-center rounded-md px-2.5 py-1.5 ${
                viewMode === "table" ? "bg-primary" : ""
              }`}
            >
              <MaterialCommunityIcons
                name="view-list-outline"
                size={16}
                color={viewMode === "table" ? colors.white : colors.text}
              />
              <Text
                className={`ml-1 text-[11px] font-bold ${
                  viewMode === "table" ? "text-white" : "text-text"
                }`}
              >
                Table
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Sidebar + Products Grid */}
        <View className="mb-4">
          <Modal
            visible={showFilters}
            transparent
            animationType="slide"
            onRequestClose={() => setShowFilters(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1 items-center justify-center bg-black/40 px-5"
            >
              <View className="w-full max-h-[82%] rounded-[26px] bg-white">
                <View className="flex-row items-center justify-between rounded-t-[26px] bg-primary px-5 py-4">
                  <Text className="text-[20px] font-black text-white">Filters</Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={clearFilters}
                      className="mr-3 rounded-lg border border-white/80 px-3 py-1.5"
                    >
                      <Text className="text-[13px] font-bold text-white">
                        Clear
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowFilters(false)}>
                      <MaterialCommunityIcons
                        name="close"
                        size={22}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  className="shrink px-5"
                  contentContainerStyle={{ paddingBottom: 20, paddingTop: 16 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                >
                  {/* Price Filter */}
                  <View className="mb-3 border-b border-borderLight pb-3">
                    <Text className="mb-2 text-[15px] font-black text-secondary">
                      Price
                    </Text>
                    <View className="mb-2 flex-row gap-3">
                      <TextInput
                        className="flex-1 rounded-md border border-borderLight px-3 py-2 text-[14px] text-text"
                        value={minimumPrice}
                        onChangeText={setMinimumPrice}
                        keyboardType="numeric"
                        placeholder="Min price"
                        placeholderTextColor={colors.grayDark}
                        accessibilityLabel="Minimum price"
                      />
                      <TextInput
                        className="flex-1 rounded-md border border-borderLight px-3 py-2 text-[14px] text-text"
                        value={maximumPrice}
                        onChangeText={setMaximumPrice}
                        keyboardType="numeric"
                        placeholder="Max price"
                        placeholderTextColor={colors.grayDark}
                        accessibilityLabel="Maximum price"
                      />
                    </View>
                    <Text className="text-[13px] font-medium text-textSecondary">
                      ₹{minimumPrice || "0"} - ₹{maximumPrice || "Any"}
                    </Text>
                  </View>

                  {/* Type Filter */}
                  <View className="mb-3 border-b border-borderLight pb-3">
                    <Text className="mb-2 text-[15px] font-black text-secondary">
                      Type
                    </Text>
                    {["Food", "Products"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        className="flex-row items-center gap-2 py-2"
                        onPress={() => {
                          setSelectedType(type);
                          if (selectedCategory) {
                            const allowed = (groupedCategories[type] || []).map(
                              (cat) => cat.name?.trim().toLowerCase(),
                            );
                            if (
                              !allowed.includes(
                                selectedCategory.trim().toLowerCase(),
                              )
                            ) {
                              setSelectedCategory("");
                              setSelectedSubCategory("");
                            }
                          }
                        }}
                      >
                        <View
                          className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                            selectedType === type
                              ? "border-primary"
                              : "border-borderLight"
                          }`}
                        >
                          {selectedType === type && (
                            <View className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </View>
                        <Text className="text-[14px] font-medium text-text">{type}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      className="flex-row items-center gap-2 py-2"
                      onPress={() => setSelectedType("")}
                    >
                      <View
                        className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                          selectedType === ""
                            ? "border-primary"
                            : "border-borderLight"
                        }`}
                      >
                        {selectedType === "" && (
                          <View className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </View>
                      <Text className="text-[14px] font-medium text-text">All Types</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <View className="mb-3 border-b border-borderLight pb-3">
                      <Text className="mb-2 text-[15px] font-black text-secondary">
                        Category
                      </Text>
                      <TouchableOpacity
                        className="flex-row items-center gap-2 py-2"
                        onPress={() => setSelectedCategory("")}
                      >
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                            selectedCategory === ""
                              ? "border-primary"
                              : "border-borderLight"
                          }`}
                        >
                          {selectedCategory === "" && (
                            <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </View>
                        <Text className="text-[14px] font-medium text-text">
                          All Categories
                        </Text>
                      </TouchableOpacity>
                      {categories.map((cat) => {
                        const isCatSelected =
                          cat?.trim().toLowerCase() ===
                          decodeURIComponent(selectedCategory || "")
                            .trim()
                            .toLowerCase();
                        return (
                          <TouchableOpacity
                            key={cat}
                            className="flex-row items-center gap-2 py-2"
                            onPress={() => setSelectedCategory(cat)}
                          >
                            <View
                              className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                                isCatSelected
                                  ? "border-primary"
                                  : "border-borderLight"
                              }`}
                            >
                              {isCatSelected && (
                                <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                              )}
                            </View>
                            <Text className="text-[14px] font-medium text-text">{cat}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Offers Filter */}
                  <View className="mb-3 border-b border-borderLight pb-3">
                    <Text className="mb-2 text-[15px] font-black text-secondary">
                      Offers
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center gap-2 py-2"
                      onPress={() => setOfferFilter(0)}
                    >
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                          offerFilter === 0
                            ? "border-primary"
                            : "border-borderLight"
                        }`}
                      >
                        {offerFilter === 0 && (
                          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </View>
                      <Text className="text-[14px] font-medium text-text">
                        All Offers
                      </Text>
                    </TouchableOpacity>
                    {[10, 20, 30, 40, 50].map((offer) => (
                      <TouchableOpacity
                        key={offer}
                        className="flex-row items-center gap-2 py-2"
                        onPress={() => setOfferFilter(offer)}
                      >
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                            offerFilter === offer
                              ? "border-primary"
                              : "border-borderLight"
                          }`}
                        >
                          {offerFilter === offer && (
                            <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </View>
                        <Text className="text-[14px] font-medium text-text">
                          {offer}% and above
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Rating Filter */}
                  <View className="mb-3 border-b border-borderLight pb-3">
                    <Text className="mb-2 text-[15px] font-black text-secondary">
                      Rating
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center gap-2 py-2"
                      onPress={() => setRatingFilter(0)}
                    >
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                          ratingFilter === 0
                            ? "border-primary"
                            : "border-borderLight"
                        }`}
                      >
                        {ratingFilter === 0 && (
                          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </View>
                      <Text className="text-[14px] font-medium text-text">
                        All Ratings
                      </Text>
                    </TouchableOpacity>
                    {[4, 3, 2].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        className="flex-row items-center gap-2 py-2"
                        onPress={() => setRatingFilter(rating)}
                      >
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                            ratingFilter === rating
                              ? "border-primary"
                              : "border-borderLight"
                          }`}
                        >
                          {ratingFilter === rating && (
                            <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                          )}
                        </View>
                        <Text className="text-[14px] font-medium text-text">
                          {rating}.0 and above
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Products Grid */}
          <View className="flex-1">
            {currentProducts.length > 0 ? (
              viewMode === "card" ? (
                <View
                  className="flex-row flex-wrap justify-between"
                  style={{ rowGap: 12, columnGap: 12 }}
                >
                  {currentProducts.map((product, index) => (
                    <View
                      key={product.id || product._id || `product-${index}`}
                      className="w-[48%]"
                    >
                      <ProductCard product={product} />
                    </View>
                  ))}
                </View>
              ) : (
                <View className="w-full" style={{ rowGap: 12 }}>
                  {currentProducts.map((product, index) => (
                    <View
                      key={product.id || product._id || `list-product-${index}`}
                      className="w-full"
                    >
                      <ProductCard product={product} horizontal />
                    </View>
                  ))}
                </View>
              )
            ) : (
              <View className="items-center justify-center py-8">
                <MaterialCommunityIcons
                  name="magnify"
                  size={48}
                  color={colors.grayDark}
                />
                <Text className="mt-3 text-base font-bold text-text">
                  No products found
                </Text>
                <Text className="mb-3 mt-1 text-center text-xs text-textSecondary">
                  {search ||
                  selectedCategory ||
                  selectedType ||
                  offerFilter ||
                  ratingFilter ||
                  selectedSubCategory ||
                  selectedColor ||
                  selectedSize
                    ? "No products matched your search or filters. Try clearing your filters."
                    : `No home chef products currently delivering to your location (${user?.area || user?.pincode || "your area"}).`}
                </Text>

                {(search ||
                  selectedCategory ||
                  selectedType ||
                  offerFilter ||
                  ratingFilter ||
                  selectedSubCategory ||
                  selectedColor ||
                  selectedSize) && (
                  <TouchableOpacity
                    className="mb-2 rounded-lg bg-gray px-3 py-2"
                    onPress={clearFilters}
                  >
                    <Text className="text-xs font-semibold text-text">
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  className="flex-row items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2"
                  onPress={() =>
                    fetchLocation((newLoc) => {
                      fetchProducts(true, newLoc);
                    })
                  }
                  disabled={fetchingLocation}
                >
                  {fetchingLocation ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={14}
                      color={colors.white}
                    />
                  )}
                  <Text className="text-xs font-semibold text-white">
                    Change Location
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View className="mb-6 flex-row items-center justify-center gap-2">
            <TouchableOpacity
              className={`rounded-lg border border-borderLight bg-white px-2.5 py-2 ${
                currentPage === 1 ? "opacity-40" : "opacity-100"
              }`}
              onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={currentPage === 1 ? colors.grayDark : colors.text}
              />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="max-h-10"
            >
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <TouchableOpacity
                    key={page}
                    className={`mx-1 rounded-lg border px-2.5 py-2 ${
                      currentPage === page
                        ? "border-primary bg-primary"
                        : "border-borderLight bg-white"
                    }`}
                    onPress={() => setCurrentPage(page)}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        currentPage === page ? "text-white" : "text-text"
                      }`}
                    >
                      {page}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              className={`rounded-lg border border-borderLight bg-white px-2.5 py-2 ${
                currentPage === totalPages ? "opacity-40" : "opacity-100"
              }`}
              onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={
                  currentPage === totalPages ? colors.grayDark : colors.text
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
