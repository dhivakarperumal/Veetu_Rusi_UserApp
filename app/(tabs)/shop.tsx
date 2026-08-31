import api from "@/app/api";
import ProductCard from "@/components/ProductCard";
import { colors } from "@/config/colors";
import { AuthContext } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useFetchLocation } from "@/hooks/useFetchLocation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  status?: string;
  final_price?: number;
  offer_price?: number;
  mrp?: number;
  offer?: number;
  variants?: Array<{
    colorName: string;
    selectedSizes?: string[];
  }>;
  chef_name?: string;
  delivery_radius?: number;
  latitude?: number;
  longitude?: number;
  area_name?: string;
  pincode?: string;
  [key: string]: any;
}

interface Category {
  c_name: string;
  category_type: string;
  name?: string;
  [key: string]: any;
}

interface HomeChef {
  chef_name: string;
  delivery_radius?: number;
  area_name?: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
  [key: string]: any;
}

const { width } = Dimensions.get("window");

export default function ShopScreen({ defaultCategory = "" }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const {
    chefFoodsCache,
    setChefFoodsCache,
    lastChefFoodsFetchTime,
    setLastChefFoodsFetchTime,
  } = useStore();

  // Products state
  const [products, setProducts] = useState<Product[]>(() => {
    const cache = Array.isArray(chefFoodsCache) ? chefFoodsCache : [];
    return cache.filter((p) => p.status?.toLowerCase() === "active");
  });

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(() => {
    const cache = Array.isArray(chefFoodsCache) ? chefFoodsCache : [];
    return cache.filter((p) => p.status?.toLowerCase() === "active");
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
  const [gridCols, setGridCols] = useState(2);

  const { fetchingLocation, fetchLocation } = useFetchLocation();
  const hasLocation = Boolean(user?.latitude && user?.longitude);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): string | null => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return null;
      const R = 6371; // Radius of earth in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(2);
    },
    []
  );

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
  const fetchProducts = useCallback(async () => {
    const isCacheValid =
      lastChefFoodsFetchTime &&
      Date.now() - lastChefFoodsFetchTime < 5 * 60 * 1000;
    const hasLoc = Boolean(user?.latitude && user?.longitude);

    if (isCacheValid && chefFoodsCache?.length > 0) {
      const myProducts = chefFoodsCache.filter((product) => {
        if (product.status?.toLowerCase() !== "active") return false;
        if (!hasLoc || !product.latitude || !product.longitude) return true;

        const distance = parseFloat(
          calculateDistance(
            user.latitude,
            user.longitude,
            product.latitude,
            product.longitude
          ) || "999"
        );

        const radius = parseFloat(product.delivery_radius || 0);
        return distance <= radius;
      });

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

      const myProducts = data.filter((product) => {
        if (product.status?.toLowerCase() !== "active") return false;
        if (!hasLoc || !product.latitude || !product.longitude) return true;

        const distance = parseFloat(
          calculateDistance(
            user.latitude,
            user.longitude,
            product.latitude,
            product.longitude
          ) || "999"
        );

        const radius = parseFloat(product.delivery_radius || 0);
        return distance <= radius;
      });

      setProducts(myProducts);
      setFilteredProducts(myProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user, chefFoodsCache, lastChefFoodsFetchTime, calculateDistance, setChefFoodsCache, setLastChefFoodsFetchTime]);

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
        parseFloat(p.final_price || p.offer_price || p.mrp || 0) <=
        parseFloat(priceRange)
    );

    // Offer filter
    if (offerFilter) {
      updated = updated.filter((p) => parseFloat(p.offer || 0) >= offerFilter);
    }

    // Sorting
    if (sortOption === "az")
      updated.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortOption === "za")
      updated.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (sortOption === "priceLowHigh")
      updated.sort(
        (a, b) =>
          parseFloat(a.final_price || a.offer_price || 0) -
          parseFloat(b.final_price || b.offer_price || 0)
      );
    if (sortOption === "priceHighLow")
      updated.sort(
        (a, b) =>
          parseFloat(b.final_price || b.offer_price || 0) -
          parseFloat(a.final_price || a.offer_price || 0)
      );
    if (sortOption === "offerHighLow")
      updated.sort((a, b) => parseFloat(b.offer || 0) - parseFloat(a.offer || 0));
    if (sortOption === "offerLowHigh")
      updated.sort((a, b) => parseFloat(a.offer || 0) - parseFloat(b.offer || 0));

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
    .filter(Boolean);

  const categories = selectedType
    ? [
        ...new Set(
          (groupedCategories[selectedType] || [])
            .map((cat) => cat.name?.trim())
            .filter(Boolean)
        ),
      ]
    : apiCategoryNames.length > 0
    ? [...new Set(apiCategoryNames)]
    : [...new Set(products.map((p) => p.category).filter(Boolean).map((cat) => cat.trim()))];

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
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No location screen
  if (!loading && !hasLocation) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.noLocationContainer}>
          <View style={styles.noLocationCard}>
            <View style={styles.locationIconContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={48}
                color={colors.primary}
              />
            </View>

            <Text style={styles.noLocationTitle}>
              Fetch your location to see nearby home chef products
            </Text>

            <Text style={styles.noLocationSubtitle}>
              We use your location to find fresh, delicious home-cooked meals
              and authentic products available for delivery in your area.
            </Text>

            <TouchableOpacity
              style={styles.fetchLocationBtn}
              onPress={() => fetchLocation(() => fetchProducts())}
              disabled={fetchingLocation}
            >
              {fetchingLocation ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.fetchLocationBtnText}>
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
                  <Text style={styles.fetchLocationBtnText}>
                    Fetch Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.permissionNote}>
              🔒 Allow location access in your app when prompted
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Location Badge */}
        <View style={styles.locationBadge}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconSmall}>
              <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Delivery Location:</Text>
              <Text style={styles.locationValue}>
                {user?.area ||
                  user?.district ||
                  user?.location_name ||
                  (user?.latitude && user?.longitude
                    ? `${parseFloat(user.latitude).toFixed(4)}, ${parseFloat(user.longitude).toFixed(4)}`
                    : "Current Location")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateLocationBtn}
            onPress={() => fetchLocation(() => fetchProducts())}
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
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons
              name={showFilters ? "close" : "filter"}
              size={20}
              color={colors.text}
            />
            <Text style={styles.filterToggleText}>
              {showFilters ? "Close" : "Filters"}
            </Text>
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
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
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort By:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortOptions}
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
                style={[
                  styles.sortOption,
                  sortOption === opt.value && styles.sortOptionActive,
                ]}
                onPress={() => setSortOption(opt.value)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortOption === opt.value && styles.sortOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          Showing <Text style={styles.resultsBold}>{filteredProducts.length}</Text> of{" "}
          <Text style={styles.resultsBold}>{products.length}</Text> products
        </Text>

        {/* Filter Sidebar + Products Grid */}
        <View style={styles.mainContainer}>
          {/* Filters */}
          {showFilters && (
            <View style={styles.filterSidebar}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filters</Text>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={styles.clearFilterBtn}
                >
                  <Text style={styles.clearFilterText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {/* Price Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={styles.priceInput}
                    value={String(priceRange)}
                    onChangeText={(val) => setPriceRange(Number(val))}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.priceValue}>
                  Up to ₹{Number(priceRange).toLocaleString()}
                </Text>
              </View>

              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Type</Text>
                {["Food", "Products"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
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
                      style={[
                        styles.radio,
                        selectedType === type && styles.radioSelected,
                      ]}
                    >
                      {selectedType === type && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setSelectedType("")}
                >
                  <View
                    style={[
                      styles.radio,
                      selectedType === "" && styles.radioSelected,
                    ]}
                  >
                    {selectedType === "" && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>All Types</Text>
                </TouchableOpacity>
              </View>

              {/* Category Filter */}
              {categories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Category</Text>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.radioOption}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <View
                        style={[
                          styles.radio,
                          cat?.trim().toLowerCase() ===
                            decodeURIComponent(selectedCategory || "")
                              .trim()
                              .toLowerCase() && styles.radioSelected,
                        ]}
                      >
                        {cat?.trim().toLowerCase() ===
                          decodeURIComponent(selectedCategory || "")
                            .trim()
                            .toLowerCase() && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Offers Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Offers</Text>
                {[10, 20, 30, 40, 50].map((offer) => (
                  <TouchableOpacity
                    key={offer}
                    style={styles.radioOption}
                    onPress={() => setOfferFilter(offer)}
                  >
                    <View
                      style={[
                        styles.radio,
                        offerFilter === offer && styles.radioSelected,
                      ]}
                    >
                      {offerFilter === offer && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{offer}% and above</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Products Grid */}
          <View style={styles.productsContainer}>
            {currentProducts.length > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                {currentProducts.map((product) => (
                  <View
                    key={product.id}
                    style={{ width: showFilters ? "48%" : "48%" }}
                  >
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noProductsContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={48}
                  color={colors.grayDark}
                />
                <Text style={styles.noProductsTitle}>No products found</Text>
                <Text style={styles.noProductsSubtitle}>
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
                    style={styles.clearFiltersBtn}
                    onPress={clearFilters}
                  >
                    <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.refetchLocationBtn}
                  onPress={() => fetchLocation(() => fetchProducts())}
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
                  <Text style={styles.refetchLocationBtnText}>
                    Re-fetch Location
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationBtn,
                currentPage === 1 && styles.paginationBtnDisabled,
              ]}
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
              style={styles.pageNumbers}
            >
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <TouchableOpacity
                    key={page}
                    style={[
                      styles.pageBtn,
                      currentPage === page && styles.pageBtnActive,
                    ]}
                    onPress={() => setCurrentPage(page)}
                  >
                    <Text
                      style={[
                        styles.pageBtnText,
                        currentPage === page && styles.pageBtnTextActive,
                      ]}
                    >
                      {page}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.paginationBtn,
                currentPage === totalPages && styles.paginationBtnDisabled,
              ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: colors.text,
    fontSize: 14,
  },
  noLocationContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  noLocationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
    alignItems: "center",
  },
  locationIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noLocationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  noLocationSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  fetchLocationBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  fetchLocationBtnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  permissionNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  locationBadge: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  locationLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  locationValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  updateLocationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toolbar: {
    gap: 10,
    marginBottom: 12,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.gray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: "row",
    gap: 8,
  },
  sortOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  resultsBold: {
    fontWeight: "700",
    color: colors.text,
  },
  mainContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  filterSidebar: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    width: "30%",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  clearFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.error,
  },
  clearFilterText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: "500",
  },
  filterSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    margin: 2,
  },
  radioLabel: {
    fontSize: 12,
    color: colors.text,
  },
  priceInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
  },
  priceValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  productsContainer: {
    flex: 1,
  },
  noProductsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  noProductsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
  },
  noProductsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    textAlign: "center",
  },
  clearFiltersBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.gray,
    borderRadius: 8,
    marginBottom: 8,
  },
  clearFiltersBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  refetchLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  refetchLocationBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  paginationBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  paginationBtnDisabled: {
    opacity: 0.4,
  },
  pageNumbers: {
    maxHeight: 40,
  },
  pageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    marginHorizontal: 4,
  },
  pageBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  pageBtnTextActive: {
    color: colors.white,
  },
});
