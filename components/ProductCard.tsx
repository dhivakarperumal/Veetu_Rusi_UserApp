import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

  const toNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const price = toNumber(product.final_price ?? product.offer_price ?? product.mrp ?? 0);
  const originalPrice = toNumber(product.mrp ?? 0);
  const discount = toNumber(product.offer ?? 0);
  const rating = toNumber(product.rating ?? product.average_rating ?? product.star_rating ?? 4.5);
  const chefName = product.chef_name || product.homeChefName || product.vendor_name || "Home Chef";

  const handlePress = () => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.8}
    >
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

        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>₹{price.toFixed(0)}</Text>
          {originalPrice > price && (
            <Text style={styles.originalPrice}>₹{originalPrice.toFixed(0)}</Text>
          )}
        </View>

        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>

        {chefName && (
          <Text style={styles.chefName} numberOfLines={1}>
            {chefName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={(event) => {
          event.stopPropagation();
        }}
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.gray,
    position: "relative",
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
    fontSize: 10,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.grayDark,
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: "600",
  },
  chefName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
