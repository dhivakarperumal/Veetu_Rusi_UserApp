import { colors } from "@/config/colors";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Product {
  id: string;
  name: string;
  mrp?: number;
  offer_price?: number;
  final_price?: number;
  offer?: number;
  image?: string;
  chef_name?: string;
  category?: string;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const price = product.final_price || product.offer_price || product.mrp || 0;
  const originalPrice = product.mrp || 0;
  const discount = product.offer || 0;

  const handlePress = () => {
    // Navigate to product detail screen
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.7}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Status Badge */}
        {product.status && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  product.status.toLowerCase() === "active"
                    ? colors.success
                    : colors.warning,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {product.status.charAt(0).toUpperCase() +
                product.status.slice(1).toLowerCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Content Container */}
      <View style={styles.content}>
        {/* Chef Name */}
        {product.chef_name && (
          <Text style={styles.chefName} numberOfLines={1}>
            {product.chef_name}
          </Text>
        )}

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Category */}
        {product.category && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        )}

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{price.toFixed(0)}</Text>
          {originalPrice > price && (
            <Text style={styles.originalPrice}>₹{originalPrice.toFixed(0)}</Text>
          )}
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.gray,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.grayLight,
  },
  placeholderText: {
    color: colors.grayDark,
    fontSize: 12,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    padding: 12,
  },
  chefName: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.grayDark,
    textDecorationLine: "line-through",
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 13,
  },
});
