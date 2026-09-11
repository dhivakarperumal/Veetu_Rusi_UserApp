import api from "@/app/api";
import ProductCard from "@/components/ProductCard";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useFetchLocation } from "@/hooks/useFetchLocation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  status?: string;
  final_price?: number | string;
  offer_price?: number | string;
  mrp?: number | string;
  offer?: number | string;
  variants?: Array<{
    colorName?: string;
    selectedSizes?: string[];
    weight?: string;
    price?: number;
    offer?: number;
    final_price?: number;
    stock?: number;
    images?: string;
  }>;
  chef_name?: string;
  delivery_radius?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  area_name?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  [key: string]: any;
}

interface Category {
  c_name: string;
  category_type: string;
  name?: string;
  [key: string]: any;
}

export default function ShopScreen({ defaultCategory = "" }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    chefFoodsCache,
    setChefFoodsCache,
    lastChefFoodsFetchTime,
    setLastChefFoodsFetchTime,
  } = useStore();

  // Parse delivery radius from various formats (e.g. "5 KM", "10km", 5, etc.)
  const parseRadius = (val: unknown, fallback = 15): number => {
    if (typeof val === "number" && !isNaN(val) && val > 0) return val;
    if (!val) return fallback;
    const match = String(val).match(/[\d.]+/);
    if (match) {
      const num = parseFloat(match[0]);
      if (!isNaN(num) && num > 0) return num;
    }
    return fallback;
  };

  // Calculate distance between two coordinates in km
  const calculateDistance = useCallback(
    (lat1: any, lon1: any, lat2: any, lon2: any): string | null => {
      const nLat1 = parseFloat(String(lat1 ?? ""));
      const nLon1 = parseFloat(String(lon1 ?? ""));
      const nLat2 = parseFloat(String(lat2 ?? ""));
      const nLon2 = parseFloat(String(lon2 ?? ""));

      if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

      const R = 6371; // Radius of earth in km
      const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
      const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((nLat1 * Math.PI) / 180) *
          Math.cos((nLat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(2);
    },
    []
  );

  const isProductDeliverable = useCallback(
    (product: Product, userLat?: number, userLon?: number) => {
      if (product.status && product.status.toLowerCase() !== "active") return false;
      if (!userLat || !userLon) return true;

      const prodLat = parseFloat(String(product.latitude ?? ""));
      const prodLon = parseFloat(String(product.longitude ?? ""));

      if (isNaN(prodLat) || isNaN(prodLon) || prodLat === 0 || prodLon === 0) {
        return true;
      }

      const distStr = calculateDistance(userLat, userLon, prodLat, prodLon);
      if (!distStr) return true;
      const distance = parseFloat(distStr);

      const radius = parseRadius(product.delivery_radius, 15);

      // Check if distance is within radius with a 3km GPS accuracy tolerance
      if (distance <= radius + 3) return true;

      // Check matching area / city / district or pincode (e.g. Tirupathur)
      const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const userArea = clean(`${user?.area || ""} ${user?.district || ""} ${user?.location_name || ""}`);
      const prodCity = clean(`${product.city || ""} ${product.district || ""} ${product.area_name || ""}`);
      const userPin = String(user?.pincode || "").trim();
      const prodPin = String(product.pincode || "").trim();

      if (userPin && prodPin && userPin === prodPin) return true;
      if (userArea && prodCity && (userArea.includes(prodCity) || prodCity.includes(userArea))) {
        if (distance <= 35) return true;
      }

      return false;
    },
    [calculateDistance, user]
  );

  // Products state
  const [products, setProducts] = useState<Product[]>(() => {
    const cache = Array.isArray(chefFoodsCache) ? chefFoodsCache : [];
    return cache.filter((p) => isProductDeliverable(p, user?.latitude, user?.longitude));
  });

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(() => {
    const cache = Array.isArray(chefFoodsCache) ? chefFoodsCache : [];
    return cache.filter((p) => isProductDeliverable(p, user?.latitude, user?.longitude));
  });

  // UI State
  const [loading, setLoading] = useState(!chefFoodsCache || chefFoodsCache.length === 0);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(defaultCategory ? true : false);

  // Filter State
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [priceRange, setPriceRange] = useState(10000);
  const [offerFilter, setOfferFilter] = useState(0);
  const [sortOption, setSortOption] = useState("");

  // Other state
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [activeLocation, setActiveLocation] = useState<{
    latitude?: number;
    longitude?: number;
  }>({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });

  const { fetchingLocation, fetchLocation } = useFetchLocation();
  const hasLocation = Boolean(
    (activeLocation.latitude ?? user?.latitude) &&
      (activeLocation.longitude ?? user?.longitude)
  );

  useEffect(() => {
    setActiveLocation({
      latitude: user?.latitude,
      longitude: user?.longitude,
    });
  }, [user?.latitude, user?.longitude]);

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
          {}
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
    async (
      forceRefresh = false,
      locationOverride?: { latitude: number; longitude: number }
    ) => {
      const activeLatitude = locationOverride?.latitude ?? activeLocation.latitude ?? user?.latitude;
      const activeLongitude = locationOverride?.longitude ?? activeLocation.longitude ?? user?.longitude;
      const isCacheValid =
        !forceRefresh &&
        lastChefFoodsFetchTime &&
        Date.now() - lastChefFoodsFetchTime < 5 * 60 * 1000;

      if (isCacheValid && chefFoodsCache?.length > 0) {
        const myProducts = chefFoodsCache.filter((product) =>
          isProductDeliverable(product, activeLatitude, activeLongitude)
        );

        setProducts(myProducts);
        setFilteredProducts(myProducts);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [foodsRes, productsRes] = await Promise.all([
          api
            .get("/chef-foods")
            .catch((err) => {
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
        const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
        const data = [...foodsData, ...productsData];

        setChefFoodsCache(data);
        setLastChefFoodsFetchTime(Date.now());

        const myProducts = data.filter((product) =>
          isProductDeliverable(product, activeLatitude, activeLongitude)
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
      user,
      activeLocation.latitude,
      activeLocation.longitude,
      chefFoodsCache,
      lastChefFoodsFetchTime,
      isProductDeliverable,
      setChefFoodsCache,
      setLastChefFoodsFetchTime,
    ]
  );

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let updated = [...products];

    // Search filter
    if (search) {
      updated = updated.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Type filter
    if (selectedType) {
      const categoriesForType = new Set(
        (groupedCategories[selectedType] || [])
          .map((cat) => cat.name?.trim().toLowerCase())
          .filter(Boolean)
      );
      if (categoriesForType.size > 0) {
        updated = updated.filter((p) =>
          categoriesForType.has(p.category?.trim().toLowerCase())
        );
      }
    }

    // Category filter
    if (selectedCategory) {
      const normalizedSelectedCategory = decodeURIComponent(
        selectedCategory
      )
        .trim()
        .toLowerCase();

      updated = updated.filter((p) => {
        const productCategory = p.category ? p.category.trim().toLowerCase() : "";
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
        p.variants?.some((v) => v.colorName === selectedColor)
      );
    }

    // Size filter
    if (selectedSize) {
      updated = updated.filter((p) =>
        p.variants?.some((v) => v.selectedSizes?.includes(selectedSize))
      );
    }

    // Price filter
    updated = updated.filter(
      (p) =>
        Number(p.final_price ?? p.offer_price ?? p.mrp ?? 0) <=
        Number(priceRange)
    );

    // Offer filter
    if (offerFilter) {
      updated = updated.filter((p) => Number(p.offer || 0) >= offerFilter);
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
          Number(b.final_price ?? b.offer_price ?? 0)
      );
    if (sortOption === "priceHighLow")
      updated.sort(
        (a, b) =>
          Number(b.final_price ?? b.offer_price ?? 0) -
          Number(a.final_price ?? a.offer_price ?? 0)
      );
    if (sortOption === "offerHighLow")
      updated.sort((a, b) => Number(b.offer || 0) - Number(a.offer || 0));
    if (sortOption === "offerLowHigh")
      updated.sort((a, b) => Number(a.offer || 0) - Number(b.offer || 0));

    setFilteredProducts([...updated]);
    setCurrentPage(1);
  }, [
    search,
    selectedCategory,
    selectedSubCategory,
    selectedColor,
    selectedSize,
    priceRange,
    offerFilter,
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
    setPriceRange(10000);
    setOfferFilter(0);
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
            .filter((name): name is string => Boolean(name))
        ),
      ]
    : apiCategoryNames.length > 0
    ? [...new Set(apiCategoryNames)]
    : [...new Set(products.map((p) => p.category).filter((cat): cat is string => Boolean(cat)).map((cat) => cat.trim()))];

  const subCategories = [
    ...new Set(
      products
        .filter((p) => {
          if (!selectedCategory) return false;
          const productCategory = p.category
            ? p.category.trim().toLowerCase()
            : "";
          const normalizedSelectedCategory = decodeURIComponent(
            selectedCategory
          )
            .trim()
            .toLowerCase();
          return productCategory === normalizedSelectedCategory;
        })
        .map((p) => p.subcategory)
        .filter(Boolean)
    ),
  ];

  const colors_list = selectedCategory
    ? [
        ...new Set(
          products
            .filter((p) => {
              const productCategory = p.category
                ? p.category.trim().toLowerCase()
                : "";
              const normalizedSelectedCategory = decodeURIComponent(
                selectedCategory
              )
                .trim()
                .toLowerCase();
              return productCategory === normalizedSelectedCategory;
            })
            .flatMap((p) => p.variants?.map((v) => v.colorName)),
        ),
      ]
    : [];

  const sizes = selectedCategory
    ? [
        ...new Set(
          products
            .filter((p) => {
              const productCategory = p.category
                ? p.category.trim().toLowerCase()
                : "";
              const normalizedSelectedCategory = decodeURIComponent(
                selectedCategory
              )
                .trim()
                .toLowerCase();
              return productCategory === normalizedSelectedCategory;
            })
            .flatMap((p) => p.variants?.flatMap((v) => v.selectedSizes || [])),
        ),
      ]
    : [];

  // Pagination
  const productsPerPage = 6;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
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
      <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
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
                fetchLocation((location) => {
                  setActiveLocation(location);
                  fetchProducts(true, location);
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
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-3"
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
              <Text className="text-[11px] font-semibold text-textSecondary">Delivery Location:</Text>
              <Text className="text-[13px] font-semibold text-text">
                {user?.area ||
                  user?.district ||
                  user?.location_name ||
                  (user?.latitude && user?.longitude
                    ? `${Number(user.latitude).toFixed(4)}, ${Number(user.longitude).toFixed(4)}`
                    : "Current Location")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="rounded-lg border border-borderLight px-3 py-2"
            onPress={() =>
              fetchLocation((location) => {
                setActiveLocation(location);
                fetchProducts(true, location);
              })
            }
            disabled={fetchingLocation}
          >
            {fetchingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="refresh"
                size={16}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View className="mb-3 gap-2.5">
          <TouchableOpacity
            className="flex-row items-center gap-1.5 self-start rounded-xl bg-gray px-3 py-2"
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons
              name={showFilters ? "close" : "filter"}
              size={20}
              color={colors.text}
            />
            <Text className="text-[13px] font-semibold text-text">
              {showFilters ? "Close" : "Filters"}
            </Text>
          </TouchableOpacity>

          <View className="h-10 flex-1 flex-row items-center gap-2 rounded-xl border border-borderLight bg-white px-2.5">
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
        </View>

        {/* Sort Options */}
        <View className="mb-3">
          <Text className="mb-2 text-xs font-semibold text-text">Sort By:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
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

        {/* Results Count */}
        <Text className="mb-3 text-xs text-textSecondary">
          Showing <Text className="font-bold text-text">{filteredProducts.length}</Text> of{" "}
          <Text className="font-bold text-text">{products.length}</Text> products
        </Text>

        {/* Filter Sidebar + Products Grid */}
        <View className="mb-4 flex-row gap-3">
          {/* Filters */}
          {showFilters && (
            <View className="w-[30%] rounded-xl border border-borderLight bg-white p-3">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-sm font-bold text-text">Filters</Text>
                <TouchableOpacity
                  onPress={clearFilters}
                  className="rounded border border-error px-2 py-1"
                >
                  <Text className="text-[11px] font-medium text-error">Clear</Text>
                </TouchableOpacity>
              </View>

              {/* Price Filter */}
              <View className="mb-3 border-b border-borderLight pb-3">
                <Text className="mb-2 text-xs font-semibold text-text">Price</Text>
                <View className="mb-2 flex-row gap-2">
                  <TextInput
                    className="flex-1 rounded-md border border-borderLight px-2 py-1.5 text-xs text-text"
                    value={String(priceRange)}
                    onChangeText={(val) => setPriceRange(Number(val))}
                    keyboardType="numeric"
                  />
                </View>
                <Text className="text-xs text-textSecondary">
                  Up to ₹{Number(priceRange).toLocaleString()}
                </Text>
              </View>

              {/* Type Filter */}
              <View className="mb-3 border-b border-borderLight pb-3">
                <Text className="mb-2 text-xs font-semibold text-text">Type</Text>
                {["Food", "Products"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    className="flex-row items-center gap-2 py-1.5"
                    onPress={() => {
                      setSelectedType(type);
                      if (selectedCategory) {
                        const allowed = (groupedCategories[type] || [])
                          .map((cat) => cat.name?.trim().toLowerCase());
                        if (
                          !allowed.includes(
                            selectedCategory.trim().toLowerCase()
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
                    <Text className="text-xs text-text">{type}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  className="flex-row items-center gap-2 py-1.5"
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
                  <Text className="text-xs text-text">All Types</Text>
                </TouchableOpacity>
              </View>

              {/* Category Filter */}
              {categories.length > 0 && (
                <View className="mb-3 border-b border-borderLight pb-3">
                  <Text className="mb-2 text-xs font-semibold text-text">Category</Text>
                  {categories.map((cat) => {
                    const isCatSelected =
                      cat?.trim().toLowerCase() ===
                      decodeURIComponent(selectedCategory || "")
                        .trim()
                        .toLowerCase();
                    return (
                      <TouchableOpacity
                        key={cat}
                        className="flex-row items-center gap-2 py-1.5"
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <View
                          className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                            isCatSelected
                              ? "border-primary"
                              : "border-borderLight"
                          }`}
                        >
                          {isCatSelected && (
                            <View className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </View>
                        <Text className="text-xs text-text">{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Offers Filter */}
              <View className="mb-3 border-b border-borderLight pb-3">
                <Text className="mb-2 text-xs font-semibold text-text">Offers</Text>
                {[10, 20, 30, 40, 50].map((offer) => (
                  <TouchableOpacity
                    key={offer}
                    className="flex-row items-center gap-2 py-1.5"
                    onPress={() => setOfferFilter(offer)}
                  >
                    <View
                      className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                        offerFilter === offer
                          ? "border-primary"
                          : "border-borderLight"
                      }`}
                    >
                      {offerFilter === offer && (
                        <View className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </View>
                    <Text className="text-xs text-text">{offer}% and above</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Products Grid */}
          <View className="flex-1">
            {currentProducts.length > 0 ? (
              <View className="flex-row flex-wrap justify-between gap-2.5">
                {currentProducts.map((product, index) => (
                  <View key={product.id || product._id || `product-${index}`} className="w-full">
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-8">
                <MaterialCommunityIcons
                  name="magnify"
                  size={48}
                  color={colors.grayDark}
                />
                <Text className="mt-3 text-base font-bold text-text">No products found</Text>
                <Text className="mb-3 mt-1 text-center text-xs text-textSecondary">
                  {search ||
                  selectedCategory ||
                  selectedType ||
                  offerFilter ||
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
                  selectedSubCategory ||
                  selectedColor ||
                  selectedSize) && (
                  <TouchableOpacity
                    className="mb-2 rounded-lg bg-gray px-3 py-2"
                    onPress={clearFilters}
                  >
                    <Text className="text-xs font-semibold text-text">Clear Filters</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  className="flex-row items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2"
                  onPress={() =>
                    fetchLocation((location) => {
                      setActiveLocation(location);
                      fetchProducts(true, location);
                    })
                  }
                  disabled={fetchingLocation}
                >
                  {fetchingLocation ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <MaterialCommunityIcons
                      name="refresh"
                      size={14}
                      color={colors.white}
                    />
                  )}
                  <Text className="text-xs font-semibold text-white">
                    Re-fetch Location
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
              onPress={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={currentPage === totalPages ? colors.grayDark : colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
