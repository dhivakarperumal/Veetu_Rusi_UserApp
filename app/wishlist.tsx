import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { useStore, WishlistItem } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WishlistScreen() {
  const router = useRouter();
  const {
    userFoodCart,
    wishlist,
    loadingWishlist,
    fetchWishlist,
    toggleWishlist,
    addToFoodCart,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const cartCount = userFoodCart.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0,
  );

  const filteredWishlist = wishlist.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [
      item.name,
      item.chef_name,
      item.category,
      item.product?.name,
      item.product?.category,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    );
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWishlist();
    } catch (e) {
      console.warn("Refresh wishlist error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemove = (item: WishlistItem) => {
    Alert.alert(
      "Remove Item",
      `Remove "${item.name || "this item"}" from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await toggleWishlist(item.product || item);
          },
        },
      ],
    );
  };

  const handleAddToCart = async (item: WishlistItem) => {
    const itemKey = String(item.product_id || item.id || item._id);
    try {
      setAddingCartId(itemKey);
      const productObj = item.product || {
        ...item,
        id: item.product_id || item.id,
      };
      await addToFoodCart(productObj, null, item.variant_size || null, 1);
      Alert.alert(
        "Added to Cart! 🛒",
        `"${item.name || "Dish"}" added to your cart.`,
        [
          { text: "Continue Shopping", style: "cancel" },
          {
            text: "View Cart",
            onPress: () => router.push("/(tabs)/cart"),
          },
        ],
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not add item to cart.");
    } finally {
      setAddingCartId(null);
    }
  };

  const handleBuyNow = (item: WishlistItem) => {
    const productObj = item.product || {
      ...item,
      id: item.product_id || item.id,
    };
    const buyNowData = {
      product: productObj,
      variant: productObj.variants?.[0] || null,
      size: item.variant_size || null,
      quantity: 1,
    };
    router.push({
      pathname: "/checkout",
      params: {
        buyNowItem: JSON.stringify(buyNowData),
      },
    });
  };

  const handlePressItem = (item: WishlistItem) => {
    const pId = item.product_id || item.id || item._id;
    if (pId) {
      router.push({
        pathname: "/product/[id]" as any,
        params: { id: String(pId) },
      });
    }
  };

  const renderItem = ({ item }: { item: WishlistItem }) => {
    const rawPrice = item.price || item.final_price || item.total_price || 0;
    const price = parseFloat(String(rawPrice)) || 0;
    const mrp = parseFloat(String(item.mrp || rawPrice)) || price;
    const discount =
      mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const rating = item.rating || item.average_rating || 4.5;
    const chefName = item.chef_name || item.homeChefName || "";
    const categoryName = item.category || item.product?.category || chefName;

    const itemKey = String(item.product_id || item.id || item._id);
    const isAdding = addingCartId === itemKey;

    let imageUrl = "";
    if (typeof item.image === "string" && item.image.trim()) {
      imageUrl = item.image.trim().split(/\s+/)[0];
    } else if (item.product?.image) {
      imageUrl = String(item.product.image).trim().split(/\s+/)[0];
    } else if (
      Array.isArray(item.product?.images) &&
      item.product.images.length > 0
    ) {
      const first = item.product.images[0];
      imageUrl =
        typeof first === "string"
          ? first.trim().split(/\s+/)[0]
          : first?.url || "";
    }

    return (
      <TouchableOpacity
        onPress={() => handlePressItem(item)}
        activeOpacity={0.9}
        className={`relative border border-borderLight bg-white shadow-sm shadow-black/10 ${
          viewMode === "card"
            ? "mb-3 w-[48%] rounded-2xl p-2.5"
            : "mb-3.5 w-full flex-row rounded-2xl p-3"
        }`}
      >
        {/* Product Thumbnail */}
        <View
          className={`relative overflow-hidden rounded-xl bg-gray ${
            viewMode === "card" ? "h-32 w-full" : "h-24 w-24"
          }`}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-grayLight">
              <MaterialCommunityIcons
                name="food"
                size={32}
                color={colors.textSecondary}
              />
            </View>
          )}

          {discount > 0 && (
            <View
              className={`absolute top-1 rounded bg-primary px-1.5 py-0.5 shadow-sm ${
                viewMode === "card" ? "left-1" : "right-1"
              }`}
            >
              <Text className="text-[9px] font-black text-white">
                {discount}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View
          className={`${
            viewMode === "card" ? "mt-2" : "ml-3"
          } flex-1 justify-between`}
        >
          <View>
            <View className="flex-row items-start justify-between">
              <Text
                className="flex-1 pr-2 text-[15px] font-bold text-text"
                numberOfLines={viewMode === "card" ? 2 : 1}
              >
                {item.name || "Food Item"}
              </Text>

              {/* Remove Trash Button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                hitSlop={8}
                className={`h-7 w-7 items-center justify-center rounded-full bg-red-50 active:bg-red-100 ${
                  viewMode === "card"
                    ? "absolute right-1.5 top-1.5 z-10 bg-white/90"
                    : ""
                }`}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>

            {Boolean(categoryName) && (
              <View className="mt-0.5 flex-row items-center gap-1">
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={12}
                  color={colors.primary}
                />
                <Text
                  className="text-[12px] font-semibold text-primary"
                  numberOfLines={1}
                >
                  {categoryName}
                </Text>
              </View>
            )}

            <View className="mt-1 flex-row items-center">
              <MaterialCommunityIcons name="star" size={12} color="#FFB800" />
              <Text className="ml-0.5 text-[11px] font-bold text-[#B37A00]">
                {Number(rating).toFixed(1)}
              </Text>
            </View>

            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-[16px] font-black text-primary">
                ₹{price.toFixed(0)}
              </Text>
              {mrp > price && (
                <Text className="text-[12px] text-textSecondary line-through">
                  ₹{mrp.toFixed(0)}
                </Text>
              )}
            </View>
          </View>

          {/* Dual Action Buttons: Add to Cart & Buy Now */}
          <View className="mt-2.5 flex-row items-center gap-1">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={isAdding}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-primary bg-white px-1 py-2 active:bg-primary/10"
            >
              <MaterialCommunityIcons
                name="cart-plus"
                size={14}
                color={colors.primary}
              />
              <Text
                className={`font-bold text-primary ${
                  viewMode === "card" ? "text-[10px]" : "text-[12px]"
                }`}
                numberOfLines={1}
              >
                {isAdding ? "Adding..." : "Add to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleBuyNow(item);
              }}
              className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-primary px-1 py-2 shadow-sm shadow-primary/30 active:opacity-90"
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={14}
                color={colors.white}
              />
              <Text
                className={`font-bold text-white ${
                  viewMode === "card" ? "text-[10px]" : "text-[12px]"
                }`}
                numberOfLines={1}
              >
                Buy Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-borderLight bg-white px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
            onPress={() => router.back()}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <View>
            <Text className="text-[18px] font-extrabold text-text">
              Wishlist
            </Text>
            <Text className="text-[11px] font-semibold text-textSecondary">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="relative h-10 w-10 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
          onPress={() => router.push("/(tabs)/cart")}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="cart-outline"
            size={22}
            color={colors.text}
          />
          {cartCount > 0 && (
            <View className="absolute -right-1 -top-1 min-w-[17px] h-[17px] items-center justify-center rounded-full bg-primary px-1">
              <Text className="text-[10px] font-black text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loadingWishlist && wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-textSecondary">
            Loading your favorites...
          </Text>
        </View>
      ) : wishlist.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <MaterialCommunityIcons
              name="heart-outline"
              size={52}
              color={colors.primary}
            />
          </View>
          <Text className="text-center text-[20px] font-extrabold text-text">
            Your Wishlist is Empty
          </Text>
          <Text className="mt-2 text-center text-[13px] leading-relaxed text-textSecondary">
            Explore delicious authentic home dishes and tap the heart icon to
            save your favorites here!
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/food")}
            className="mt-6 flex-row items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 shadow-md shadow-primary/30 active:opacity-90"
          >
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={18}
              color={colors.white}
            />
            <Text className="text-base font-bold text-white">
              Explore Dishes
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List of Wishlisted Items */
        <View className="flex-1">
          <View className="mx-4 mt-3 flex-row items-center rounded-xl border border-borderLight bg-white px-3">
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              className="h-12 flex-1 px-2 text-[13px] text-text"
              placeholder="Search wishlist..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="mx-4 mt-3 flex-row self-end rounded-lg border border-borderLight bg-white p-1">
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
              accessibilityLabel="List view"
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

          <FlatList
            data={filteredWishlist}
            numColumns={viewMode === "card" ? 2 : 1}
            key={viewMode}
            columnWrapperStyle={
              viewMode === "card"
                ? { justifyContent: "space-between" }
                : undefined
            }
            keyExtractor={(item, index) =>
              String(item.product_id || item.id || item._id || index)
            }
            renderItem={renderItem}
            contentContainerClassName="p-4 pb-12"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-16">
                <MaterialCommunityIcons
                  name="magnify-close"
                  size={42}
                  color={colors.grayDark}
                />
                <Text className="mt-3 text-base font-bold text-text">
                  No wishlist items found
                </Text>
                <Text className="mt-1 text-center text-xs text-textSecondary">
                  Try a different product, chef, or category name.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
