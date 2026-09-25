import { customAlert as Alert } from "@/components/CustomAlertHost";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { Product, useStore } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface QuickViewModalProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  visible,
  onClose,
}: QuickViewModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToFoodCart, toggleWishlist, isInWishlist } = useStore();
  const insets = useSafeAreaInsets();

  const [quantity, setQuantity] = useState(1);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [adding, setAdding] = useState(false);

  const productId = String(product?.id || product?._id || product?.product_id || "");
  const isWishlisted = isInWishlist(productId);

  // Available sizes/variants
  const sizes = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const allSizes: string[] = [];
      product.variants.forEach((v) => {
        if (Array.isArray(v.selectedSizes) && v.selectedSizes.length > 0) {
          allSizes.push(...v.selectedSizes);
        } else if (v.weight) {
          allSizes.push(v.weight);
        }
      });
      if (allSizes.length > 0) return [...new Set(allSizes)];
    }
    return [];
  }, [product]);

  const selectedSize = sizes[selectedSizeIndex] || null;

  // Pricing
  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const variant = product.variants?.[0];
    const val =
      variant?.offerPrice ||
      variant?.price ||
      variant?.final_price ||
      product.final_price ||
      product.offer_price ||
      product.price ||
      product.mrp ||
      0;
    return parseFloat(String(val)) || 0;
  }, [product]);

  const originalPrice = useMemo(() => {
    if (!product) return 0;
    return parseFloat(String(product.mrp || unitPrice)) || unitPrice;
  }, [product, unitPrice]);

  const discount = useMemo(() => {
    if (!product) return 0;
    if (product.offer && Number(product.offer) > 0) {
      return Math.round(Number(product.offer));
    }
    if (originalPrice > unitPrice && originalPrice > 0) {
      return Math.round(((originalPrice - unitPrice) / originalPrice) * 100);
    }
    return 0;
  }, [product, originalPrice, unitPrice]);

  const totalPrice = (unitPrice * quantity).toFixed(0);

  // Parse image
  const imageUrl = useMemo(() => {
    if (!product) return null;
    if (typeof product.image === "string" && product.image.trim()) {
      return product.image.trim().split(/\s+/)[0];
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      return typeof first === "string"
        ? first.trim().split(/\s+/)[0]
        : first?.url || null;
    }
    if (typeof product.images === "string" && product.images.trim()) {
      try {
        const parsed = JSON.parse(product.images);
        return Array.isArray(parsed) && parsed.length > 0
          ? parsed[0]
          : product.images.trim();
      } catch {
        return product.images.trim().split(/\s+/)[0];
      }
    }
    if (product.variants?.[0]?.images) {
      const vImg: any = product.variants[0].images;
      if (typeof vImg === "string") {
        return vImg.trim().split(/\s+/)[0];
      }
      if (Array.isArray(vImg) && vImg.length > 0) {
        return String(vImg[0]);
      }
    }
    return null;
  }, [product]);

  if (!product) return null;

  const chefName =
    product.chef_name ||
    product.homeChefName ||
    product.vendor_name ||
    "Home Chef";

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToFoodCart(product, null, selectedSize, quantity);
      Alert.alert(
        "Added to Cart! 🛒",
        `${quantity}x ${product.name || "item"} added to your cart.`,
        [
          { text: "Continue Shopping", onPress: onClose, style: "cancel" },
          {
            text: "View Cart",
            onPress: () => {
              onClose();
              router.push("/(tabs)/cart");
            },
          },
        ],
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add item to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    onClose();
    const buyNowData = {
      product,
      variant: product.variants?.[0] || null,
      size: selectedSize,
      quantity,
    };
    router.push({
      pathname: "/checkout",
      params: {
        buyNowItem: JSON.stringify(buyNowData),
      },
    });
  };

  const handleViewDetails = () => {
    const id = product.id || product._id;
    onClose();
    if (id) {
      router.push({
        pathname: "/product/[id]" as any,
        params: { id: String(id) },
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View 
          className="w-full max-h-[90%] rounded-t-[32px] bg-white px-5 pt-3 shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          {/* Grab Handle */}
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-grayDark/30" />

          {/* Top Bar: Category Pill, Wishlist & Close Button */}
          <View className="mb-3 flex-row items-center justify-between">
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-[11px] font-bold text-primary">
                {product.category || product.category_type || "Home Food"}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-full bg-gray active:bg-grayDark/20"
                onPress={async () => {
                  const uid = user?.id || user?.user_id;
                  if (!uid) {
                    Alert.alert(
                      "Login Required",
                      "Please login to add this dish to your wishlist.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Login",
                          onPress: () => {
                            onClose();
                            router.push("/auth/login");
                          },
                        },
                      ],
                    );
                    return;
                  }
                  await toggleWishlist(product, product.variants?.[0], selectedSize);
                }}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={18}
                  color={isWishlisted ? colors.error : colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="h-8 w-8 items-center justify-center rounded-full bg-gray"
                onPress={onClose}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-[460px]">
            {/* Product Image Section */}
            <View className="relative mb-3 h-48 w-full overflow-hidden rounded-2xl bg-gray">
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
                    size={48}
                    color={colors.textSecondary}
                  />
                </View>
              )}

              {discount > 0 && (
                <View className="absolute left-3 top-3 rounded-lg bg-primary px-2.5 py-1 shadow-sm">
                  <Text className="text-[11px] font-black text-white">
                    {discount}% OFF
                  </Text>
                </View>
              )}
            </View>

            {/* Product Title & Chef Name */}
            <Text className="text-[20px] font-black text-text" numberOfLines={2}>
              {product.name || "Chef Dish"}
            </Text>

            <View className="mt-1 flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="chef-hat"
                size={16}
                color={colors.primary}
              />
              <Text className="text-[13px] font-semibold text-primary">
                By {chefName}
              </Text>
            </View>

            {/* Price Row */}
            <View className="mt-2.5 flex-row items-baseline gap-2">
              <Text className="text-[24px] font-black text-text">
                ₹{unitPrice.toFixed(0)}
              </Text>
              {originalPrice > unitPrice && (
                <Text className="text-[14px] font-semibold text-textSecondary line-through">
                  ₹{originalPrice.toFixed(0)}
                </Text>
              )}
            </View>

            {/* Sizes / Variants Selector (if any) */}
            {sizes.length > 0 && (
              <View className="mt-3">
                <Text className="mb-2 text-[12px] font-bold text-textSecondary">
                  Select Size / Portion:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {sizes.map((s, idx) => {
                    const isSelected = selectedSizeIndex === idx;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSelectedSizeIndex(idx)}
                        className={`rounded-xl border px-3.5 py-1.5 ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-borderLight bg-gray"
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-bold ${
                            isSelected ? "text-white" : "text-text"
                          }`}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Description (if present) */}
            {Boolean(product.description) && (
              <View className="mt-3 border-t border-borderLight pt-2.5">
                <Text className="text-[11px] leading-relaxed text-textSecondary" numberOfLines={3}>
                  {product.description}
                </Text>
              </View>
            )}

            {/* Quantity Stepper & Total */}
            <View className="mt-4 flex-row items-center justify-between border-t border-borderLight pt-3.5">
              <View>
                <Text className="text-[11px] font-semibold text-textSecondary">
                  Quantity
                </Text>
                <View className="mt-1 flex-row items-center gap-3">
                  <TouchableOpacity
                    className="h-8 w-8 items-center justify-center rounded-full bg-gray active:bg-border"
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={16}
                      color={colors.text}
                    />
                  </TouchableOpacity>

                  <Text className="min-w-[28px] text-center text-[16px] font-black text-text">
                    {quantity}
                  </Text>

                  <TouchableOpacity
                    className="h-8 w-8 items-center justify-center rounded-full bg-gray active:bg-border"
                    onPress={() => setQuantity((q) => q + 1)}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={16}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-[11px] font-semibold text-textSecondary">
                  Total Price
                </Text>
                <Text className="mt-0.5 text-[22px] font-black text-primary">
                  ₹{totalPrice}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="mt-4 flex-row items-center gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border-2 border-primary bg-white py-3.5 active:bg-primary/10"
              onPress={handleAddToCart}
              disabled={adding}
            >
              <MaterialCommunityIcons
                name="cart-plus"
                size={19}
                color={colors.primary}
              />
              <Text className="text-[14px] font-bold text-primary">
                {adding ? "Adding..." : "Add to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 shadow-md shadow-primary/30 active:opacity-90"
              onPress={handleBuyNow}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={19}
                color={colors.white}
              />
              <Text className="text-[14px] font-bold text-white">
                Buy Now
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="mt-3 items-center justify-center py-1.5"
            onPress={handleViewDetails}
          >
            <Text className="text-[12px] font-bold text-textSecondary">
              View Full Product Details →
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
