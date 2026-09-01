import api from "@/app/api";
import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`).catch(async () => {
          return await api.get(`/chef-foods/${id}`);
        });
        setProduct(res.data?.data || res.data);
      } catch (e) {
        console.log("Error loading product detail:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const price = Number(product?.final_price ?? product?.offer_price ?? product?.mrp ?? 0);
  const originalPrice = Number(product?.mrp ?? 0);
  const discount = Number(product?.offer ?? 0);
  const rating = Number(product?.rating ?? product?.average_rating ?? 4.5);
  const chefName = product?.chef_name || product?.homeChefName || product?.vendor_name;
  const imageUrl =
    product?.image ||
    (Array.isArray(product?.images) && product?.images.length > 0
      ? typeof product?.images[0] === "string"
        ? product?.images[0]
        : product?.images[0]?.url || product?.images[0]?.image
      : undefined) ||
    product?.image_url ||
    product?.product_image ||
    product?.food_image ||
    product?.photo;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.name || "Product Details"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          <View style={styles.imageWrapper}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={styles.noImageBox}>
                <MaterialCommunityIcons name="food" size={64} color={colors.textSecondary} />
                <Text style={styles.noImageText}>No Image Available</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.title}>{product?.name || "Product"}</Text>

            {Boolean(chefName) && (
              <View style={styles.chefRow}>
                <MaterialCommunityIcons name="chef-hat" size={18} color={colors.primary} />
                <Text style={styles.chefName}>{chefName}</Text>
              </View>
            )}

            <View style={styles.ratingPriceRow}>
              <View style={styles.priceGroup}>
                <Text style={styles.price}>₹{price.toFixed(0)}</Text>
                {originalPrice > price && (
                  <Text style={styles.originalPrice}>₹{originalPrice.toFixed(0)}</Text>
                )}
              </View>

              <View style={styles.ratingBadge}>
                <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
              </View>
            </View>

            {Boolean(product?.description) && (
              <View style={styles.descSection}>
                <Text style={styles.descTitle}>Description</Text>
                <Text style={styles.descText}>{product?.description}</Text>
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <MaterialCommunityIcons name="minus" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Bottom bar */}
      {!loading && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalPrice}>₹{(price * quantity).toFixed(0)}</Text>
          </View>
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={() => {
              router.push("/(tabs)/cart");
            }}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color={colors.white} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    paddingBottom: 100,
  },
  imageWrapper: {
    width: width,
    height: width * 0.75,
    backgroundColor: colors.gray,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImageBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grayLight,
  },
  noImageText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  discountBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 12,
  },
  detailsSection: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  chefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  chefName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  ratingPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  priceGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B37A00",
  },
  descSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    minWidth: 24,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addToCartText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
