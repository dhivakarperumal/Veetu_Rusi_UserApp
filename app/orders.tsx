import { AuthContext } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "./api";

const getStatusStyle = (status?: string) => {
  const normalized = String(status || "").toLowerCase();

  switch (normalized) {
    case "delivered":
      return {
        badge: "bg-emerald-50 border border-emerald-200",
        text: "text-emerald-600",
      };
    case "shipped":
    case "out for delivery":
    case "on the way":
      return {
        badge: "bg-blue-50 border border-blue-200",
        text: "text-blue-600",
      };
    case "processing":
    case "preparing":
    case "pending":
      return {
        badge: "bg-amber-50 border border-amber-200",
        text: "text-amber-600",
      };
    default:
      return {
        badge: "bg-gray-50 border border-gray-200",
        text: "text-gray-600",
      };
  }
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const { addToCart } = useStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [address, setAddress] = useState<any>(null);

  const normalizeOrderList = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
    if (Array.isArray(payload?.data?.result)) return payload.data.result;
    return [];
  };

  const getOrderId = (order: any) =>
    order?.id ?? order?.order_id ?? order?._id ?? order?.order_number;

  const hasAssignedDeliveryPartner = (order: any) => {
    const normalizedStatus = String(order?.status ?? order?.order_status ?? "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .trim();

    if (normalizedStatus !== "delivery partner assigned") {
      return false;
    }

    const assignedPartner =
      order?.delivery_partner ??
      order?.deliveryPartner ??
      order?.assigned_delivery_partner ??
      order?.delivery_agent ??
      order?.driver ??
      order?.rider;

    return Boolean(
      assignedPartner ||
      order?.delivery_partner_id ||
      order?.deliveryPartnerId ||
      order?.assigned_delivery_partner_id ||
      order?.delivery_partner_assigned ||
      order?.is_delivery_partner_assigned,
    );
  };

  const getDeliveryPartnerDetails = (order: any) => {
    const partner =
      order?.delivery_partner ??
      order?.deliveryPartner ??
      order?.assigned_delivery_partner ??
      order?.delivery_agent ??
      order?.driver ??
      order?.rider;
    const partnerData = partner && typeof partner === "object" ? partner : {};

    return {
      name:
        partnerData.name ||
        partnerData.full_name ||
        order?.delivery_partner_name ||
        order?.deliveryPartnerName ||
        (typeof partner === "string" ? partner : "Delivery partner assigned"),
      phone:
        partnerData.phone ||
        partnerData.mobile ||
        order?.delivery_partner_phone ||
        order?.deliveryPartnerPhone ||
        "Phone not available",
    };
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get("/user-food-orders/my-orders");
        if (isMounted) {
          setOrders(normalizeOrderList(res.data));
        }
      } catch (error) {
        console.error("Failed to load orders", error);
        if (isMounted) {
          Alert.alert("Orders", "Unable to load your orders right now.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const openOrderDetails = async (order: any) => {
    setLoadingOrder(true);

    try {
      const orderId = getOrderId(order);
      const candidateUrls = orderId
        ? [
            `/user-food-orders/${orderId}`,
            `/user-food-orders/${orderId}/details`,
            `/user-food-orders/${orderId}/order-details`,
            `/orders/${orderId}`,
          ]
        : [];

      let details = order;

      for (const url of candidateUrls) {
        try {
          const orderRes = await api.get(url);
          const payload = orderRes?.data;
          const nextOrder =
            payload && typeof payload === "object"
              ? (payload.order ?? payload.data ?? payload.result ?? payload)
              : payload;

          if (nextOrder && typeof nextOrder === "object") {
            details = Array.isArray(nextOrder) ? nextOrder[0] : nextOrder;
            break;
          }
        } catch {
          // try next url
        }
      }

      setSelectedOrder(details);
      setAddress({
        customer_name: details?.customer_name,
        street_address: details?.street_address,
        city: details?.city,
        district: details?.district,
        state: details?.state,
        zip_code: details?.zip_code,
        country: details?.country,
        customer_phone: details?.customer_phone,
        customer_email: details?.customer_email,
      });
      setShowPopup(true);
    } catch (error) {
      console.error("Failed to load order details", error);
      Alert.alert("Order details", "Unable to load this order right now.");
    } finally {
      setLoadingOrder(false);
    }
  };

  const formatPrice = (value: any) => {
    const amount = Number(value ?? 0);
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const reorderFood = (order: any) => {
    const orderItems =
      order?.items || order?.order_items || order?.food_items || [];

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      Alert.alert("Reorder Food", "No food items were found in this order.");
      return;
    }

    orderItems.forEach((item: any, index: number) => {
      const product = item?.product || item?.food || item;
      const productId =
        product?.id ??
        product?._id ??
        item?.product_id ??
        item?.food_id ??
        `${getOrderId(order)}-${index}`;
      const price =
        item?.price ??
        item?.unit_price ??
        product?.final_price ??
        product?.offer_price ??
        product?.mrp ??
        0;

      addToCart(
        {
          ...product,
          id: String(productId),
          name:
            product?.name || product?.product_name || item?.name || "Food item",
          final_price: price,
          image: product?.image || product?.image_url || item?.image,
        },
        item?.quantity ?? item?.qty ?? 1,
      );
    });

    Alert.alert(
      "Reorder Food",
      "The ordered food has been added to your cart.",
    );
  };

  const getActionButtons = (status?: string, order?: any) => {
    const normalizedStatus = String(status || "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .trim();

    if (
      normalizedStatus === "delivered" ||
      normalizedStatus === "order delivered"
    ) {
      return [
        {
          label: "Food Review",
          icon: "star-outline",
          variant: "green",
          action: () => {
            Alert.alert("Food Review", "Food review is ready for this order.");
          },
        },
        {
          label: "Reorder Food",
          icon: "refresh",
          variant: "blue",
          action: (order?: any) => reorderFood(order),
        },
        {
          label: "Delivery Partner Review",
          icon: "truck-delivery-outline",
          variant: "outline",
          action: () => {
            Alert.alert(
              "Delivery Partner Review",
              "Delivery partner review is ready for this order.",
            );
          },
        },
      ];
    }

    const actionButtons = [
      {
        label: "View details",
        icon: "eye-outline",
        variant: "green",
        action: (order?: any) => {
          if (order) {
            openOrderDetails(order);
          } else {
            setShowPopup(true);
          }
        },
      },
      {
        label: "Reorder Delivery Partner",
        icon: "truck-delivery",
        variant: "outline",
        action: () => {
          Alert.alert(
            "Delivery Partner",
            "Your previous delivery partner can be reused for this order.",
          );
        },
      },
      {
        label: "Back to cart",
        icon: "cart-arrow-left",
        variant: "light",
        action: () => {
          setShowPopup(false);
          router.push("/(tabs)/cart");
        },
      },
    ];

    if (hasAssignedDeliveryPartner(order)) {
      actionButtons.splice(1, 0, {
        label: "Track",
        icon: "map-marker-path",
        variant: "blue",
        action: () => {
          Alert.alert(
            "Track Delivery",
            "Your delivery partner is assigned. Live tracking will be available shortly.",
          );
        },
      });
    }

    return actionButtons;
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center border-b border-borderLight bg-white px-[18px] py-3">
        <Pressable
          accessibilityLabel="Go back"
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-gray"
          hitSlop={8}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
        </Pressable>
        <Text className="text-[22px] font-bold text-text">My Orders</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#FF8C42" />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[18px] font-bold text-text">No orders yet</Text>
          <Text className="mt-2 text-center text-[14px] text-textSecondary">
            Your recent orders will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {orders.map((order: any, index: number) => {
            const status = order.status || order.order_status || "Processing";
            const statusStyle = getStatusStyle(status);
            const actionButtons = getActionButtons(status, order);
            const title =
              order.restaurant_name ||
              order.vendor_name ||
              order.item_name ||
              `Order ${order.order_number || order.id}`;

            return (
              <View
                key={order.id ?? order.order_number ?? `order-${index}`}
                className="mb-4"
              >
                <View className="mb-3 rounded-[22px] border border-borderLight bg-white p-5 shadow-sm shadow-black/5">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openOrderDetails(order)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[16px] font-black text-text">
                        {order.order_number || `Order #${order.id}`}
                      </Text>
                      <View
                        className={`rounded-full px-3 py-1 ${statusStyle.badge}`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${statusStyle.text}`}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <Text className="mt-3 text-[15px] font-bold text-text">
                      {title}
                    </Text>
                    <Text className="mt-1 text-[13px] font-medium text-textSecondary">
                      {order.items?.length || order.total_items || 0} items ·{" "}
                      {formatPrice(
                        order.total_amount || order.amount || order.total || 0,
                      )}
                    </Text>
                    <Text className="mt-2 text-[12px] font-semibold text-textSecondary">
                      {order.created_at || order.order_date || "Recent order"}
                    </Text>
                  </TouchableOpacity>

                  <View className="mt-4 flex-row flex-wrap justify-between">
                    {actionButtons.map((action) => {
                      const isGreen = action.variant === "green";
                      const isBlue = action.variant === "blue";
                      const isLight = action.variant === "light";

                      return (
                        <TouchableOpacity
                          key={action.label}
                          onPress={() => action.action(order)}
                          className={`mb-2 rounded-full border px-3 py-3 ${
                            isGreen
                              ? "border-[#1E7D5B] bg-[#1E7D5B]"
                              : isBlue
                                ? "border-[#3B82F6] bg-[#3B82F6]"
                                : isLight
                                  ? "border-[#D7E8DE] bg-[#F0F8F4]"
                                  : "border-[#D0E7F8] bg-[#F3F9FF]"
                          }`}
                          style={{ width: "48%" }}
                        >
                          <View className="flex-row items-center justify-center">
                            <MaterialCommunityIcons
                              name={action.icon as any}
                              size={18}
                              color={isGreen || isBlue ? "#FFFFFF" : "#1F2937"}
                            />
                            <Text
                              className={`ml-2 text-[14px] font-bold ${
                                isGreen || isBlue ? "text-white" : "text-text"
                              }`}
                              numberOfLines={1}
                            >
                              {action.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {hasAssignedDeliveryPartner(order) ? (
                    <View className="rounded-[22px] border border-[#CFE2FF] bg-[#F1F7FF] p-5">
                      <View className="mb-3 flex-row items-center justify-between">
                        <Text className="text-[12px] font-bold text-[#1558D6]">
                          Delivery Partner Assigned
                        </Text>
                        <View className="rounded-full bg-[#DCEAFF] px-3 py-1">
                          <Text className="text-[11px] font-bold text-[#1558D6]">
                            ASSIGNED
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[13px] font-bold uppercase tracking-[3px] text-[#2872F0]">
                        Delivery Partner
                      </Text>
                      <View className="mt-3 flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-[16px] font-bold text-text">
                            {getDeliveryPartnerDetails(order).name}
                          </Text>
                          <View className="mt-1 flex-row items-center">
                            <MaterialCommunityIcons
                              name="account-outline"
                              size={16}
                              color="#6B7A90"
                            />
                            <Text className="ml-1 text-[13px] text-textSecondary">
                              {getDeliveryPartnerDetails(order).phone}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          className="flex-row items-center rounded-[14px] bg-[#2167F5] px-4 py-3"
                          onPress={() =>
                            Alert.alert(
                              "Track Delivery",
                              "Your delivery partner is assigned. Live tracking will be available shortly.",
                            )
                          }
                        >
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={17}
                            color="#FFFFFF"
                          />
                          <Text className="ml-2 text-[13px] font-bold text-white">
                            TRACK
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={showPopup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPopup(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-[28px] bg-white p-5 pb-7">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="flex-1 text-[22px] font-black text-text">
                {selectedOrder?.order_number ||
                  `Order #${selectedOrder?.id}` ||
                  "Order details"}
              </Text>
              {hasAssignedDeliveryPartner(selectedOrder) ? (
                <View className="ml-3 rounded-full bg-[#DCEAFF] px-3 py-2">
                  <Text className="text-[12px] font-bold text-[#1558D6]">
                    Delivery Partner Assigned
                  </Text>
                </View>
              ) : null}
              <Pressable onPress={() => setShowPopup(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#374151"
                />
              </Pressable>
            </View>

            {loadingOrder ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color="#FF8C42" />
              </View>
            ) : selectedOrder ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="mb-4">
                  <Text className="text-[13px] font-bold uppercase text-textSecondary">
                    Status
                  </Text>
                  <View
                    className={`mt-2 inline-flex self-start rounded-full px-3 py-1 ${getStatusStyle(selectedOrder.status || selectedOrder.order_status).badge}`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${getStatusStyle(selectedOrder.status || selectedOrder.order_status).text}`}
                    >
                      {selectedOrder.status ||
                        selectedOrder.order_status ||
                        "Processing"}
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-[13px] font-bold uppercase text-textSecondary">
                    Total
                  </Text>
                  <Text className="mt-1 text-[18px] font-bold text-text">
                    {formatPrice(
                      selectedOrder.total_amount ||
                        selectedOrder.amount ||
                        selectedOrder.total ||
                        0,
                    )}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-[13px] font-bold uppercase text-textSecondary">
                    Items
                  </Text>
                  {Array.isArray(
                    selectedOrder.items || selectedOrder.order_items,
                  ) ? (
                    (selectedOrder.items || selectedOrder.order_items).map(
                      (item: any, index: number) => (
                        <View
                          key={`${item?.name || item?.product_name || "item"}-${index}`}
                          className="mt-2 flex-row items-center justify-between"
                        >
                          <Text className="text-[14px] text-text">
                            {item?.name || item?.product_name || "Food item"}
                          </Text>
                          <Text className="text-[14px] font-semibold text-textSecondary">
                            {item?.quantity || 1} ×{" "}
                            {formatPrice(item?.price || item?.unit_price || 0)}
                          </Text>
                        </View>
                      ),
                    )
                  ) : (
                    <Text className="mt-2 text-[14px] text-textSecondary">
                      Order details are being prepared.
                    </Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-[13px] font-bold uppercase text-textSecondary">
                    Delivery Address
                  </Text>
                  <Text className="mt-2 text-[14px] text-text">
                    {address?.customer_name ||
                      selectedOrder.customer_name ||
                      "Customer"}
                  </Text>
                  <Text className="mt-1 text-[14px] text-textSecondary">
                    {address?.street_address ||
                      selectedOrder.street_address ||
                      "Address not available"}
                  </Text>
                  <Text className="text-[14px] text-textSecondary">
                    {(address?.city || selectedOrder.city || "") +
                      ((address?.city || selectedOrder.city) &&
                      (address?.district || selectedOrder.district)
                        ? ", "
                        : "") +
                      (address?.district || selectedOrder.district || "")}
                  </Text>
                  <Text className="text-[14px] text-textSecondary">
                    {(address?.state || selectedOrder.state || "") +
                      ((address?.state || selectedOrder.state) &&
                      (address?.zip_code || selectedOrder.zip_code)
                        ? ", "
                        : "") +
                      (address?.zip_code || selectedOrder.zip_code || "")}
                  </Text>
                  <Text className="text-[14px] text-textSecondary">
                    {address?.country || selectedOrder.country || ""}
                  </Text>
                  <Text className="mt-2 text-[14px] text-textSecondary">
                    {address?.customer_phone ||
                      selectedOrder.customer_phone ||
                      "No phone provided"}
                  </Text>
                </View>

                {hasAssignedDeliveryPartner(selectedOrder) ? (
                  <View className="mb-4 rounded-[22px] border border-[#CFE2FF] bg-[#F1F7FF] p-5">
                    <Text className="text-[13px] font-bold uppercase tracking-[3px] text-[#2872F0]">
                      Delivery Partner
                    </Text>
                    <View className="mt-3 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-[16px] font-bold text-text">
                          {getDeliveryPartnerDetails(selectedOrder).name}
                        </Text>
                        <View className="mt-1 flex-row items-center">
                          <MaterialCommunityIcons
                            name="account-outline"
                            size={16}
                            color="#6B7A90"
                          />
                          <Text className="ml-1 text-[13px] text-textSecondary">
                            {getDeliveryPartnerDetails(selectedOrder).phone}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="flex-row items-center rounded-[14px] bg-[#2167F5] px-4 py-3"
                        onPress={() =>
                          Alert.alert(
                            "Track Delivery",
                            "Your delivery partner is assigned. Live tracking will be available shortly.",
                          )
                        }
                      >
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={17}
                          color="#FFFFFF"
                        />
                        <Text className="ml-2 text-[13px] font-bold text-white">
                          TRACK
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
