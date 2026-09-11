import api, { API_BASE_URL } from "@/app/api";
import AppHeader from "@/components/AppHeader";
import { colors } from "@/config/colors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours in ms

const formatDateTime = (value: any) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getChefNames = (items: any[], fallbackName?: string) => {
  if (!Array.isArray(items) || !items.length) {
    return fallbackName || "Home Chef";
  }
  const names = [
    ...new Set(
      items
        .map((item) => item.chef_name || item.chef || item.created_by_name)
        .filter(Boolean)
    ),
  ];
  if (!names.length) return fallbackName || "Home Chef";
  return names.join(", ");
};

const getChefGroups = (items: any[]) => {
  if (!Array.isArray(items) || !items.length) return [];
  const chefs: Record<string, any> = {};
  items.forEach((item) => {
    const key =
      item.chef_name ||
      item.chef_email ||
      item.chef_user_id ||
      item.chef_id ||
      item.created_by_name ||
      "unknown";
    const chefName =
      item.chef_name || item.chef || item.created_by_name || "Home Chef";
    const chefEmail = item.chef_email || item.email || "N/A";
    const chefPhone = item.chef_phone || item.phone || "N/A";
    const quantity = Number(item.quantity) || 1;
    const price =
      parseFloat(item.price || item.final_price || item.mrp || 0) || 0;

    if (!chefs[key]) {
      chefs[key] = {
        name: chefName,
        email: chefEmail,
        phone: chefPhone,
        items: [],
        total_amount: 0,
        total_quantity: 0,
      };
    }

    chefs[key].items.push(item);
    chefs[key].total_amount += price * quantity;
    chefs[key].total_quantity += quantity;
  });

  return Object.values(chefs).map((chef: any) => ({
    ...chef,
    total_amount: parseFloat(chef.total_amount.toFixed(2)),
  }));
};

function useCancelCountdown(orderedAt: any) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!orderedAt) return;
    const deadline = new Date(orderedAt).getTime() + CANCEL_WINDOW_MS;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(left > 0 ? left : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [orderedAt]);

  return remaining;
}

function formatCountdown(ms: number | null) {
  if (ms === null) return "";
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

// Sub-component: Order cancel countdown bar
function CustomerCancelBar({
  order,
  onCancel,
}: {
  order: any;
  onCancel: () => void;
}) {
  const remaining = useCancelCountdown(order.ordered_at);
  const s = String(order.status || "").toLowerCase();

  if (s === "cancelled" || s === "delivered" || s === "completed") return null;

  const ineligibleReason =
    s === "picked up"
      ? "Already Picked Up"
      : s === "out for delivery"
      ? "Out for Delivery"
      : remaining !== null && remaining <= 0
      ? "Cancellation window expired (2hr limit)"
      : null;

  if (ineligibleReason) {
    return (
      <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-2.5">
        <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
        <View className="flex-1 flex-row flex-wrap">
          <Text className="text-[11px] font-bold text-red-600">
            Cancellation Not Available
          </Text>
          <Text className="ml-1 text-[11px] text-red-500">
            — {ineligibleReason}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-4 mb-3 flex-row items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-2.5">
      <View className="flex-row items-center gap-1.5">
        <MaterialCommunityIcons name="clock-outline" size={16} color="#D97706" />
        <Text className="text-[11px] text-amber-900">
          Cancel window:{" "}
          <Text className="font-mono font-bold text-amber-700">
            {remaining !== null ? formatCountdown(remaining) : "…"}
          </Text>
        </Text>
      </View>
      <TouchableOpacity
        onPress={onCancel}
        className="flex-row items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 active:bg-red-700"
      >
        <MaterialCommunityIcons name="close" size={12} color="#FFF" />
        <Text className="text-[11px] font-bold text-white">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ newOrderId?: string }>();
  const { user, logout } = useAuth();
  const { fetchUserFoodCart } = useStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Cancel order modal
  const [cancelOrder, setCancelOrder] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Review Food modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Review Delivery Partner modal
  const [showDeliveryReviewModal, setShowDeliveryReviewModal] = useState(false);
  const [deliveryReviewOrder, setDeliveryReviewOrder] = useState<any>(null);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [deliveryComment, setDeliveryComment] = useState("");
  const [deliveryImage, setDeliveryImage] = useState<any>(null);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setSessionExpired(false);
      const res = await api.get("/user-food-orders/my-orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.warn("Failed to load food orders:", err?.message || err);
      const is401 =
        err?.status === 401 ||
        err?.response?.status === 401 ||
        String(err?.message || "").toLowerCase().includes("token expired") ||
        String(err?.message || "").toLowerCase().includes("unauthorized");

      if (is401) {
        setSessionExpired(true);
        Alert.alert(
          "Session Expired",
          "Your login session has expired. Please log in again to access your orders.",
          [
            {
              text: "Log In",
              onPress: async () => {
                await logout();
                router.replace("/auth/login");
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, logout, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  // Handle auto-open if navigated with newOrderId
  useEffect(() => {
    if (!params.newOrderId) return;
    const fetchAndOpen = async () => {
      try {
        const res = await api.get(`/user-food-orders/${params.newOrderId}`);
        if (res?.data) {
          setSelectedOrder(res.data);
        }
      } catch (err) {
        console.error("Failed to load newly created order:", err);
      }
    };
    fetchAndOpen();
  }, [params.newOrderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const resolveImageUrl = (url: any) => {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.replace(/\\/g, "/");
    const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}${finalPath}`;
  };

  const openOrder = async (order: any) => {
    if (order.delivery_partner_name || order.delivery_partner_phone) {
      setSelectedOrder(order);
      return;
    }
    try {
      const res = await api.get(`/user-food-orders/${order.id}`);
      setSelectedOrder(res.data || order);
    } catch {
      setSelectedOrder(order);
    }
  };

  // Reorder
  const handleReorder = async (order: any) => {
    try {
      setLoading(true);
      const userId = user?.id || user?.user_id;
      const promises = (order.items || []).map((item: any) => {
        const payload = {
          user_id: userId,
          product_id: item.product_id || item.food_id || item.id,
          name: item.name || item.product_name,
          image: item.image || "",
          price: parseFloat(item.price || 0),
          total_price: parseFloat(item.price || 0) * (item.quantity || 1),
          quantity: item.quantity || 1,
          chef_user_id: item.chef_user_id || item.created_by || "",
          chef_id: item.chef_id || "",
          chef_name:
            item.chef_name || item.chef || item.created_by_name || "",
          chef_phone: item.chef_phone || "",
          chef_email: item.chef_email || "",
          franchise_id: item.franchise_id || "",
          franchise_user_id: item.franchise_user_id || "",
          franchise_email: item.franchise_email || "",
          franchise_name: item.franchise_name || "",
          franchise_phone: item.franchise_phone || "",
          ordered_by_name: user?.name || user?.username || "",
          ordered_by_user_id: userId,
          ordered_by_email: user?.email || "",
          ordered_by_phone: user?.phone || user?.mobile || "",
        };
        return api.post("/user-food", payload);
      });
      await Promise.all(promises);
      await fetchUserFoodCart();
      Alert.alert(
        "Items Added to Cart! 🛒",
        "Your favorite items have been added to your cart.",
        [
          {
            text: "Go to Cart",
            onPress: () => router.push("/(tabs)/cart"),
          },
        ]
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to reorder items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel order execution
  const executeCancelOrder = async () => {
    if (!cancelOrder) return;
    if (!cancellationReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for cancellation.");
      return;
    }
    setCancelSubmitting(true);
    try {
      await api.post(`/user-food-orders/cancel/${cancelOrder.id}`, {
        cancellation_reason: cancellationReason,
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelOrder.id
            ? { ...o, status: "Cancelled", cancellation_reason: cancellationReason }
            : o
        )
      );
      if (selectedOrder?.id === cancelOrder.id) {
        setSelectedOrder((prev: any) => ({
          ...prev,
          status: "Cancelled",
          cancellation_reason: cancellationReason,
        }));
      }
      setCancelOrder(null);
      setCancellationReason("");
      Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Cancellation Failed", err?.message || "Failed to cancel order.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Live tracking map
  const handleTrack = (order: any) => {
    const lat = order.delivery_partner_lat;
    const lng = order.delivery_partner_lng;
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Live Tracking", "Live GPS tracking location is not available yet for this delivery.");
    }
  };

  // Review Food modal open
  const openReviewModal = (order: any) => {
    setReviewOrder(order);
    const firstItem = order.items?.[0] || {};
    setReviewProductId(firstItem.product_id || firstItem.id || "");
    setReviewRating(5);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewProductId) {
      Alert.alert("Error", "Please select an item to review.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const selectedItem = reviewOrder?.items?.find(
        (item: any) => (item.product_id || item.id) === reviewProductId
      );

      const homeChefId =
        selectedItem?.chef_id ||
        selectedItem?.created_by ||
        reviewOrder?.chef_id ||
        reviewOrder?.created_by ||
        null;
      const homeChefUserId =
        selectedItem?.chef_user_id ||
        selectedItem?.created_by_user_id ||
        reviewOrder?.chef_user_id ||
        reviewOrder?.created_by_user_id ||
        null;
      const homeChefName =
        selectedItem?.chef_name ||
        selectedItem?.chef ||
        selectedItem?.created_by_name ||
        reviewOrder?.chef_name ||
        reviewOrder?.created_by_name ||
        null;
      const homeChefEmail =
        selectedItem?.chef_email ||
        selectedItem?.email ||
        selectedItem?.created_by_email ||
        reviewOrder?.chef_email ||
        reviewOrder?.created_by_email ||
        null;
      const homeChefPhone =
        selectedItem?.chef_phone ||
        selectedItem?.phone ||
        selectedItem?.created_by_phone ||
        reviewOrder?.chef_phone ||
        reviewOrder?.created_by_phone ||
        null;

      const franchiseAdminId =
        selectedItem?.franchise_admin_id ||
        selectedItem?.franchise_user_id ||
        reviewOrder?.franchise_admin_id ||
        reviewOrder?.franchise_user_id ||
        reviewOrder?.franchise_id ||
        null;
      const franchiseAdminEmail =
        selectedItem?.franchise_admin_email ||
        selectedItem?.franchise_email ||
        reviewOrder?.franchise_admin_email ||
        reviewOrder?.franchise_email ||
        null;
      const franchiseAdminName =
        selectedItem?.franchise_admin_name ||
        selectedItem?.franchise_name ||
        reviewOrder?.franchise_admin_name ||
        reviewOrder?.franchise_name ||
        null;

      const userId = user?.id || user?.user_id;

      await api.post("/reviews", {
        product_id: reviewProductId,
        user_id: userId,
        user_name: user?.name || user?.username || user?.email || "Customer",
        user_email: user?.email || null,
        rating: reviewRating,
        comment: reviewComment || "",
        home_chef_id: homeChefId,
        home_chef_user_id: homeChefUserId,
        home_chef_name: homeChefName,
        home_chef_email: homeChefEmail,
        home_chef_phone: homeChefPhone,
        franchise_admin_id: franchiseAdminId,
        franchise_admin_email: franchiseAdminEmail,
        franchise_admin_name: franchiseAdminName,
        created_by: userId,
        updated_by: userId,
      });

      Alert.alert("Thank You! ⭐", "Your review has been submitted successfully.");
      setShowReviewModal(false);
      setReviewOrder(null);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Review Failed", err?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Review Delivery Partner modal open
  const openDeliveryReviewModal = (order: any) => {
    setDeliveryReviewOrder(order);
    setDeliveryRating(5);
    setDeliveryComment("");
    setDeliveryImage(null);
    setShowDeliveryReviewModal(true);
  };

  const pickDeliveryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDeliveryImage(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const submitDeliveryReview = async () => {
    setDeliverySubmitting(true);
    try {
      const userId = user?.id || user?.user_id;
      const formData = new FormData();

      const deliveryPartnerId =
        deliveryReviewOrder?.delivery_partner_id ||
        deliveryReviewOrder?.delivery_partner_user_id ||
        "";
      const deliveryPartnerName =
        deliveryReviewOrder?.delivery_partner_name || "";
      const deliveryPartnerPhone =
        deliveryReviewOrder?.delivery_partner_phone || "";
      const deliveryPartnerEmail =
        deliveryReviewOrder?.delivery_partner_email || "";
      const franchiseAdminId =
        deliveryReviewOrder?.franchise_admin_id ||
        deliveryReviewOrder?.franchise_user_id ||
        "";
      const franchiseAdminName =
        deliveryReviewOrder?.franchise_admin_name || "";

      formData.append("user_id", String(userId || ""));
      formData.append("user_name", String(user?.name || user?.username || "Customer"));
      formData.append("user_email", String(user?.email || ""));
      formData.append("rating", String(deliveryRating));
      formData.append("comment", deliveryComment || "");
      formData.append("delivery_partner_id", String(deliveryPartnerId));
      formData.append("delivery_partner_name", deliveryPartnerName);
      formData.append("delivery_partner_phone", deliveryPartnerPhone);
      formData.append("delivery_partner_email", deliveryPartnerEmail);
      formData.append("franchise_admin_id", String(franchiseAdminId));
      formData.append("franchise_admin_name", franchiseAdminName);
      formData.append("created_by", String(userId || ""));
      formData.append("updated_by", String(userId || ""));

      if (deliveryImage) {
        const localUri = deliveryImage.uri;
        const filename = localUri.split("/").pop() || "review.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("image", {
          uri: localUri,
          name: filename,
          type,
        } as any);
      }

      await api.post("/delivery-partner-review", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Review Submitted! 🛵", "Thank you for reviewing your delivery partner.");
      setShowDeliveryReviewModal(false);
      setDeliveryReviewOrder(null);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Review Failed", err?.message || "Failed to submit review.");
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered" || s === "completed") {
      return { bg: "bg-emerald-100", text: "text-emerald-700" };
    }
    if (s === "cancelled") {
      return { bg: "bg-red-100", text: "text-red-700" };
    }
    if (s === "new order" || s === "pending" || s === "order placed") {
      return { bg: "bg-amber-100", text: "text-amber-700" };
    }
    return { bg: "bg-blue-100", text: "text-blue-700" };
  };

  if (!user || sessionExpired) {
    return (
      <View
        className="flex-1 bg-[#F8F9FA]"
        style={{ paddingTop: insets.top }}
      >
        <AppHeader title="My Orders" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <MaterialCommunityIcons
              name={sessionExpired ? "clock-alert-outline" : "account-lock-outline"}
              size={48}
              color={colors.primary}
            />
          </View>
          <Text className="text-xl font-black text-text">
            {sessionExpired ? "Session Expired" : "Login Required"}
          </Text>
          <Text className="mt-2 text-center text-xs text-textSecondary">
            {sessionExpired
              ? "Your login session has expired. Please sign in again to view and track your food orders."
              : "Please log in to your account to view and track your food orders."}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (sessionExpired) {
                await logout();
              }
              router.push("/auth/login");
            }}
            className="mt-6 rounded-2xl bg-primary px-8 py-3.5 shadow-md shadow-primary/30"
          >
            <Text className="font-bold text-white">
              {sessionExpired ? "Log In Again" : "Log In Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#F8F9FA]"
      style={{ paddingTop: insets.top }}
    >
      <AppHeader title="My Food Orders" />

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-xs text-textSecondary">Loading orders...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + 60,
          }}
          className="px-4 pt-3"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {orders.length === 0 ? (
            <View className="mt-16 items-center justify-center rounded-3xl border border-dashed border-borderLight bg-white p-10 text-center shadow-sm">
              <MaterialCommunityIcons name="receipt" size={54} color={colors.grayDark} />
              <Text className="mt-4 text-lg font-black text-text">No Food Orders Yet</Text>
              <Text className="mt-1.5 text-center text-xs text-textSecondary">
                Explore delicious homemade food prepared by authentic home chefs!
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/food")}
                className="mt-6 rounded-2xl bg-primary px-6 py-3 shadow-md shadow-primary/30"
              >
                <Text className="text-xs font-bold text-white">Browse Home Chefs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {orders.map((order) => {
                const statusTheme = getStatusColor(order.status);
                const itemsCount =
                  order.items?.reduce(
                    (sum: number, it: any) => sum + (Number(it.quantity) || 1),
                    0
                  ) || 0;
                const totalAmount = parseFloat(
                  order.final_total != null
                    ? order.final_total
                    : order.total_amount || 0
                );
                const isDelivered =
                  order.status === "Delivered" || order.status === "Completed";
                const hasDeliveryPartner =
                  (order.status === "Delivery Partner Assigned" ||
                    order.status === "Picked Up" ||
                    order.status === "Out for Delivery" ||
                    order.status === "Delivered") &&
                  Boolean(order.delivery_partner_name);

                return (
                  <View
                    key={order.id}
                    className="overflow-hidden rounded-3xl border border-borderLight bg-white shadow-sm"
                  >
                    {/* Header */}
                    <View className="flex-row items-center justify-between border-b border-borderLight bg-[#FAFAFA] px-4 py-3.5">
                      <View>
                        <Text className="text-[10px] font-black uppercase tracking-wider text-textSecondary">
                          Order #{order.order_id || order.id}
                        </Text>
                        <Text className="mt-0.5 text-xs font-semibold text-text">
                          {formatDateTime(order.ordered_at)}
                        </Text>
                      </View>
                      <View className={`rounded-full px-3 py-1 ${statusTheme.bg}`}>
                        <Text className={`text-[11px] font-bold ${statusTheme.text}`}>
                          {order.status === "Pending" ? "New Order" : order.status || "New Order"}
                        </Text>
                      </View>
                    </View>

                    {/* Details Body */}
                    <View className="p-4">
                      {/* Delivery Slot & Chef */}
                      <View className="mb-3 flex-row gap-2.5">
                        <View className="flex-1 rounded-2xl bg-[#F9FAFB] p-2.5">
                          <Text className="text-[10px] uppercase font-bold text-textSecondary">
                            Delivery Slot
                          </Text>
                          <Text className="mt-1 text-xs font-bold text-text" numberOfLines={1}>
                            {order.delivery_date || "-"}
                          </Text>
                          <Text className="text-[11px] text-textSecondary">
                            {order.delivery_time ? `at ${order.delivery_time}` : ""}
                          </Text>
                        </View>

                        <View className="flex-1 rounded-2xl bg-[#F9FAFB] p-2.5">
                          <Text className="text-[10px] uppercase font-bold text-textSecondary">
                            Home Chef
                          </Text>
                          <Text className="mt-1 text-xs font-bold text-primary" numberOfLines={1}>
                            {getChefNames(order.items, order.chef_name)}
                          </Text>
                          <Text className="text-[11px] text-textSecondary">
                            {itemsCount} {itemsCount === 1 ? "dish" : "dishes"}
                          </Text>
                        </View>
                      </View>

                      {/* Items Preview */}
                      <View className="mb-3">
                        {order.items?.slice(0, 2).map((item: any, idx: number) => (
                          <Text
                            key={idx}
                            className="text-xs text-textSecondary"
                            numberOfLines={1}
                          >
                            • {item.name || item.product_name} (×{item.quantity || 1})
                          </Text>
                        ))}
                        {order.items?.length > 2 && (
                          <Text className="mt-0.5 text-[11px] font-semibold text-primary">
                            +{order.items.length - 2} more items
                          </Text>
                        )}
                      </View>

                      {/* Amount */}
                      <View className="flex-row items-center justify-between border-t border-borderLight pt-2.5">
                        <Text className="text-xs font-semibold text-textSecondary">
                          Total Paid
                        </Text>
                        <View className="flex-row items-baseline gap-1.5">
                          <Text className="text-base font-black text-text">
                            ₹{totalAmount.toFixed(0)}
                          </Text>
                          {parseFloat(order.discount_amount || 0) > 0 && (
                            <Text className="text-[11px] text-textSecondary line-through">
                              ₹{parseFloat(order.total_amount || 0).toFixed(0)}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Delivery Partner banner if assigned */}
                      {hasDeliveryPartner && (
                        <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-3">
                          <View>
                            <Text className="text-[10px] font-black uppercase text-blue-600">
                              Delivery Partner
                            </Text>
                            <Text className="mt-0.5 text-xs font-bold text-text">
                              {order.delivery_partner_name}
                            </Text>
                            {Boolean(order.delivery_partner_phone) && (
                              <Text className="text-[11px] text-textSecondary">
                                📞 {order.delivery_partner_phone}
                              </Text>
                            )}
                          </View>

                          {!isDelivered && (
                            <TouchableOpacity
                              onPress={() => handleTrack(order)}
                              className="flex-row items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5"
                            >
                              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#FFF" />
                              <Text className="text-[11px] font-bold text-white">Track</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Customer Cancellation countdown bar */}
                    <CustomerCancelBar
                      order={order}
                      onCancel={() => {
                        setCancelOrder(order);
                        setCancellationReason("");
                      }}
                    />

                    {/* Action buttons */}
                    <View className="flex-row flex-wrap items-center gap-2 border-t border-borderLight bg-[#FAFAFA] p-3">
                      <TouchableOpacity
                        onPress={() => openOrder(order)}
                        className="flex-row items-center gap-1 rounded-xl bg-primary px-3.5 py-2 active:opacity-90"
                      >
                        <MaterialCommunityIcons name="file-document-outline" size={14} color="#FFF" />
                        <Text className="text-xs font-bold text-white">View Details</Text>
                      </TouchableOpacity>

                      {isDelivered && (
                        <>
                          <TouchableOpacity
                            onPress={() => openReviewModal(order)}
                            className="flex-row items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2"
                          >
                            <MaterialCommunityIcons name="star-outline" size={14} color="#059669" />
                            <Text className="text-xs font-bold text-emerald-700">Review Food</Text>
                          </TouchableOpacity>

                          {Boolean(order.delivery_partner_name) && (
                            <TouchableOpacity
                              onPress={() => openDeliveryReviewModal(order)}
                              className="flex-row items-center gap-1 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2"
                            >
                              <MaterialCommunityIcons name="moped" size={14} color="#2563EB" />
                              <Text className="text-xs font-bold text-blue-700">Review Partner</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={() => handleReorder(order)}
                            className="flex-row items-center gap-1 rounded-xl bg-blue-600 px-3 py-2"
                          >
                            <MaterialCommunityIcons name="refresh" size={14} color="#FFF" />
                            <Text className="text-xs font-bold text-white">Reorder</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          visible={Boolean(selectedOrder)}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View className="max-h-[90%] rounded-t-[32px] bg-white p-5 shadow-2xl">
              {/* Modal Header */}
              <View className="mb-4 flex-row items-center justify-between border-b border-borderLight pb-3">
                <View>
                  <Text className="text-lg font-black text-text">Order Details</Text>
                  <Text className="text-xs text-textSecondary">
                    Order #{selectedOrder.order_id || selectedOrder.id}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOrder(null)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]">
                {/* Delivery Information */}
                <View className="mb-4 rounded-2xl bg-[#F9FAFB] p-3.5">
                  <Text className="text-[10px] font-black uppercase text-textSecondary">
                    Delivery Address
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-text">
                    {selectedOrder.customer_name || selectedOrder.ordered_by_name || selectedOrder.name}
                  </Text>
                  <Text className="text-xs text-textSecondary">
                    📞 {selectedOrder.customer_phone || selectedOrder.ordered_by_phone || selectedOrder.phone}
                  </Text>
                  <Text className="mt-1 text-xs leading-relaxed text-textSecondary">
                    {[
                      selectedOrder.street_address,
                      selectedOrder.city,
                      selectedOrder.district,
                      selectedOrder.state,
                      selectedOrder.zip_code,
                      selectedOrder.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>

                {/* Items List */}
                <View className="mb-4">
                  <Text className="mb-2 text-xs font-black uppercase text-textSecondary">
                    Dishes Ordered
                  </Text>
                  {selectedOrder.items?.map((it: any, index: number) => {
                    const img = resolveImageUrl(it.image);
                    const itemTotal =
                      (parseFloat(it.price) || 0) * (it.quantity || 1);
                    return (
                      <View
                        key={index}
                        className="mb-2 flex-row items-center gap-3 rounded-2xl border border-borderLight p-2.5"
                      >
                        <View className="h-12 w-12 overflow-hidden rounded-xl bg-gray">
                          {img ? (
                            <Image source={{ uri: img }} className="h-full w-full" resizeMode="cover" />
                          ) : (
                            <View className="h-full w-full items-center justify-center bg-grayLight">
                              <MaterialCommunityIcons name="food" size={20} color={colors.textSecondary} />
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-text" numberOfLines={1}>
                            {it.name || it.product_name}
                          </Text>
                          <Text className="text-[11px] text-textSecondary">
                            Qty {it.quantity || 1} × ₹{parseFloat(it.price || 0).toFixed(0)}
                          </Text>
                        </View>
                        <Text className="text-xs font-black text-text">
                          ₹{itemTotal.toFixed(0)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Bill Summary */}
                <View className="mb-4 rounded-2xl border border-borderLight p-3.5">
                  <Text className="mb-2 text-xs font-black uppercase text-textSecondary">
                    Bill Summary
                  </Text>
                  <View className="mb-1.5 flex-row justify-between">
                    <Text className="text-xs text-textSecondary">Order Date</Text>
                    <Text className="text-xs font-semibold text-text">
                      {formatDateTime(selectedOrder.ordered_at)}
                    </Text>
                  </View>
                  <View className="mb-1.5 flex-row justify-between">
                    <Text className="text-xs text-textSecondary">Delivery Slot</Text>
                    <Text className="text-xs font-semibold text-text">
                      {selectedOrder.delivery_date} {selectedOrder.delivery_time ? `(${selectedOrder.delivery_time})` : ""}
                    </Text>
                  </View>
                  <View className="mb-1.5 flex-row justify-between">
                    <Text className="text-xs text-textSecondary">Payment Method</Text>
                    <Text className="text-xs font-semibold text-text">
                      {selectedOrder.payment_method || "Cash on Delivery"}
                    </Text>
                  </View>
                  {parseFloat(selectedOrder.discount_amount || 0) > 0 && (
                    <View className="mb-1.5 flex-row justify-between">
                      <Text className="text-xs font-semibold text-emerald-600">Discount</Text>
                      <Text className="text-xs font-bold text-emerald-600">
                        -₹{parseFloat(selectedOrder.discount_amount).toFixed(0)}
                      </Text>
                    </View>
                  )}
                  <View className="mt-2 flex-row justify-between border-t border-borderLight pt-2">
                    <Text className="text-sm font-black text-text">Grand Total</Text>
                    <Text className="text-base font-black text-primary">
                      ₹{parseFloat(selectedOrder.final_total ?? selectedOrder.total_amount ?? 0).toFixed(0)}
                    </Text>
                  </View>
                </View>

                {/* Chef Groups */}
                <View className="mb-4">
                  <Text className="mb-2 text-xs font-black uppercase text-textSecondary">
                    Chef Information
                  </Text>
                  {getChefGroups(selectedOrder.items).map((chef: any, idx: number) => (
                    <View
                      key={idx}
                      className="mb-2 rounded-2xl bg-[#F9FAFB] p-3 border border-borderLight"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-black text-text">{chef.name}</Text>
                        <Text className="text-xs font-bold text-primary">
                          ₹{chef.total_amount.toFixed(0)}
                        </Text>
                      </View>
                      <Text className="mt-1 text-[11px] text-textSecondary">
                        Dishes: {chef.total_quantity} • 📞 {chef.phone}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Delivery Partner */}
                {Boolean(selectedOrder.delivery_partner_name) && (
                  <View className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
                    <Text className="text-[10px] font-black uppercase text-blue-600">
                      Assigned Delivery Partner
                    </Text>
                    <Text className="mt-1 text-sm font-bold text-text">
                      {selectedOrder.delivery_partner_name}
                    </Text>
                    <Text className="text-xs text-textSecondary">
                      📞 {selectedOrder.delivery_partner_phone || "N/A"}
                    </Text>
                    {selectedOrder.status !== "Delivered" && (
                      <TouchableOpacity
                        onPress={() => handleTrack(selectedOrder)}
                        className="mt-3 flex-row items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2"
                      >
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#FFF" />
                        <Text className="text-xs font-bold text-white">Track Live Location</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancelOrder && (
        <Modal
          visible={Boolean(cancelOrder)}
          animationType="fade"
          transparent
          onRequestClose={() => setCancelOrder(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 items-center justify-center bg-black/60 p-5"
          >
            <View className="w-full rounded-3xl bg-white p-5 shadow-2xl">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-black text-text">Cancel Food Order</Text>
                <TouchableOpacity
                  onPress={() => setCancelOrder(null)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-textSecondary">
                Are you sure you want to cancel order #{cancelOrder.order_id || cancelOrder.id}? Please state the reason:
              </Text>

              <TextInput
                value={cancellationReason}
                onChangeText={setCancellationReason}
                placeholder="e.g. Ordered by mistake, wrong delivery slot..."
                placeholderTextColor={colors.grayDark}
                multiline
                numberOfLines={3}
                className="mt-3 rounded-2xl border border-border bg-[#F9FAFB] p-3 text-xs text-text"
              />

              <View className="mt-4 flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={() => setCancelOrder(null)}
                  className="rounded-xl border border-borderLight px-4 py-2.5"
                >
                  <Text className="text-xs font-bold text-text">Keep Order</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={executeCancelOrder}
                  disabled={cancelSubmitting}
                  className="flex-row items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 disabled:opacity-60"
                >
                  {cancelSubmitting && (
                    <ActivityIndicator size="small" color="#FFF" />
                  )}
                  <Text className="text-xs font-bold text-white">
                    {cancelSubmitting ? "Cancelling..." : "Confirm Cancel"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Review Food Modal */}
      {showReviewModal && reviewOrder && (
        <Modal
          visible={showReviewModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowReviewModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 justify-end bg-black/60"
          >
            <View className="max-h-[85%] rounded-t-[32px] bg-white p-5 shadow-2xl">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-black text-text">Review Food Quality</Text>
                <TouchableOpacity
                  onPress={() => setShowReviewModal(false)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Select Dish */}
                <Text className="mb-1.5 text-xs font-bold text-textSecondary">
                  Select Item to Review:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 flex-row gap-2">
                  {reviewOrder.items?.map((it: any, idx: number) => {
                    const itemId = it.product_id || it.id || String(idx);
                    const isSelected = reviewProductId === itemId;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setReviewProductId(itemId)}
                        className={`mr-2 rounded-2xl border px-3 py-2 ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-borderLight bg-[#F9FAFB]"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-white" : "text-text"
                          }`}
                        >
                          {it.name || it.product_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Rating */}
                <Text className="mb-1.5 text-xs font-bold text-textSecondary">
                  Rate your meal:
                </Text>
                <View className="mb-3 flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        reviewRating >= star ? "bg-amber-400" : "bg-gray"
                      }`}
                    >
                      <Text
                        className={`text-base font-black ${
                          reviewRating >= star ? "text-white" : "text-textSecondary"
                        }`}
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Comment */}
                <Text className="mb-1.5 text-xs font-bold text-textSecondary">
                  Comments:
                </Text>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Tell us about the taste, portion, and presentation..."
                  placeholderTextColor={colors.grayDark}
                  multiline
                  numberOfLines={4}
                  className="rounded-2xl border border-border bg-[#F9FAFB] p-3 text-xs text-text"
                />

                <TouchableOpacity
                  onPress={submitReview}
                  disabled={reviewSubmitting}
                  className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 shadow-md shadow-emerald-600/20 active:opacity-90 disabled:opacity-60"
                >
                  {reviewSubmitting && (
                    <ActivityIndicator size="small" color="#FFF" />
                  )}
                  <Text className="text-sm font-bold text-white">
                    {reviewSubmitting ? "Submitting..." : "Submit Food Review"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Review Delivery Partner Modal */}
      {showDeliveryReviewModal && deliveryReviewOrder && (
        <Modal
          visible={showDeliveryReviewModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDeliveryReviewModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1 justify-end bg-black/60"
          >
            <View className="max-h-[85%] rounded-t-[32px] bg-white p-5 shadow-2xl">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-lg font-black text-text">Review Delivery Partner</Text>
                <TouchableOpacity
                  onPress={() => setShowDeliveryReviewModal(false)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Partner Name Banner */}
                <View className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
                  <Text className="text-[10px] font-black uppercase text-blue-600">
                    Delivery Partner
                  </Text>
                  <Text className="mt-0.5 text-sm font-bold text-text">
                    {deliveryReviewOrder.delivery_partner_name}
                  </Text>
                  <Text className="text-xs text-textSecondary">
                    📞 {deliveryReviewOrder.delivery_partner_phone || "N/A"}
                  </Text>
                </View>

                {/* Rating */}
                <Text className="mb-1.5 text-xs font-bold text-textSecondary">
                  Rate Delivery Service:
                </Text>
                <View className="mb-3 flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setDeliveryRating(star)}
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        deliveryRating >= star ? "bg-amber-400" : "bg-gray"
                      }`}
                    >
                      <Text
                        className={`text-base font-black ${
                          deliveryRating >= star ? "text-white" : "text-textSecondary"
                        }`}
                      >
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Comment */}
                <Text className="mb-1.5 text-xs font-bold text-textSecondary">
                  Feedback / Experience:
                </Text>
                <TextInput
                  value={deliveryComment}
                  onChangeText={setDeliveryComment}
                  placeholder="Was the delivery on time and packaged safely?"
                  placeholderTextColor={colors.grayDark}
                  multiline
                  numberOfLines={4}
                  className="rounded-2xl border border-border bg-[#F9FAFB] p-3 text-xs text-text"
                />

                {/* Image Upload */}
                <Text className="mb-1.5 mt-3 text-xs font-bold text-textSecondary">
                  Attach Photo (Optional):
                </Text>
                {deliveryImage ? (
                  <View className="relative mb-3 h-28 w-28 overflow-hidden rounded-2xl border border-borderLight">
                    <Image source={{ uri: deliveryImage.uri }} className="h-full w-full" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setDeliveryImage(null)}
                      className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-red-600"
                    >
                      <Ionicons name="close" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickDeliveryImage}
                    className="mb-3 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 bg-[#F9FAFB]"
                  >
                    <MaterialCommunityIcons name="camera-plus-outline" size={20} color={colors.primary} />
                    <Text className="text-xs font-bold text-primary">Upload Photo</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={submitDeliveryReview}
                  disabled={deliverySubmitting}
                  className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 shadow-md shadow-blue-600/20 active:opacity-90 disabled:opacity-60"
                >
                  {deliverySubmitting && (
                    <ActivityIndicator size="small" color="#FFF" />
                  )}
                  <Text className="text-sm font-bold text-white">
                    {deliverySubmitting ? "Submitting..." : "Submit Delivery Review"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}
