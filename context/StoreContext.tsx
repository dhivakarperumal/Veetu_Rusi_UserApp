import api, { API_BASE_URL } from "@/app/api";
import { AuthContext } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

export const FOOD_CART_STORAGE_KEY = "@veetu_rusi_user_food_cart";

export interface Product {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  status?: string;
  final_price?: number | string;
  offer_price?: number | string;
  mrp?: number | string;
  offer?: number | string;
  variants?: {
    colorName?: string;
    selectedSizes?: string[];
    weight?: string;
    price?: number;
    offer?: number;
    offerPrice?: number;
    final_price?: number;
    stock?: number;
    images?: string | string[];
    [key: string]: any;
  }[];
  chef_name?: string;
  chef_id?: string;
  chef_user_id?: string;
  chef_phone?: string;
  chef_email?: string;
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

export interface CategoryItem {
  c_name?: string;
  category_type?: string;
  name?: string;
  image?: string | string[];
  images?: string | string[];
  [key: string]: any;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  image?: string;
  price: number;
  mrp?: number;
  total_price: number;
  quantity: number;
  variant_size?: string;
  variant_color?: string;
  chef_user_id?: string;
  chef_id?: string;
  chef_name?: string;
  chef_phone?: string;
  chef_email?: string;
  [key: string]: any;
}

export interface WishlistItem {
  id?: string;
  _id?: string;
  product_id: string;
  user_id?: string;
  name?: string;
  image?: string;
  price?: number;
  mrp?: number;
  total_price?: number;
  variant_size?: string;
  variant_color?: string;
  chef_name?: string;
  rating?: number;
  product?: any;
  [key: string]: any;
}

export const WISHLIST_STORAGE_KEY = "@veetu_rusi_user_wishlist";

function normalizeWishlistImage(image: unknown) {
  if (typeof image !== "string") return image;

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  return image
    .replace("http://localhost:5000", apiOrigin)
    .replace("http://127.0.0.1:5000", apiOrigin);
}

interface StoreContextType {
  chefFoodsCache: Product[];
  setChefFoodsCache: (products: Product[]) => void;
  lastChefFoodsFetchTime: number | null;
  setLastChefFoodsFetchTime: (time: number | null) => void;
  categoriesCache: CategoryItem[];
  setCategoriesCache: (categories: CategoryItem[]) => void;

  userFoodCart: CartItem[];
  addToFoodCart: (
    product: Record<string, any>,
    variant?: any,
    size?: string | null,
    qty?: number,
  ) => Promise<boolean>;
  removeFromFoodCart: (id: string) => Promise<void>;
  updateFoodCartQuantity: (id: string, qty: number) => Promise<void>;
  clearUserFoodCart: () => Promise<void>;
  fetchUserFoodCart: () => Promise<void>;
  placeFoodOrder: (orderData: Record<string, any>) => Promise<any>;

  wishlist: WishlistItem[];
  loadingWishlist: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (
    product: Record<string, any>,
    variant?: any,
    size?: string | null,
  ) => Promise<boolean>;
  isInWishlist: (productId: string | number) => boolean;
}

export const StoreContext = createContext<StoreContextType | undefined>(
  undefined,
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [chefFoodsCache, setChefFoodsCache] = useState<Product[]>([]);
  const [lastChefFoodsFetchTime, setLastChefFoodsFetchTime] = useState<
    number | null
  >(null);
  const [categoriesCache, setCategoriesCache] = useState<CategoryItem[]>([]);
  const [userFoodCart, setUserFoodCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState<boolean>(false);

  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Load cart and wishlist from AsyncStorage on startup
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(FOOD_CART_STORAGE_KEY);
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            setUserFoodCart(parsed);
          }
        }
        const storedWishlist = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
        if (storedWishlist) {
          const parsedW = JSON.parse(storedWishlist);
          if (Array.isArray(parsedW)) {
            setWishlist(parsedW);
          }
        }
      } catch (err) {
        console.error("Failed to load cart/wishlist from storage:", err);
      }
    };
    loadStoredData();
  }, []);

  // Fetch cart from backend if user is authenticated
  const fetchUserFoodCart = useCallback(async () => {
    const userId = user?.user_id || user?.id;
    if (!userId) return;

    try {
      const res = await api.get(`/user-food/${userId}`);
      if (Array.isArray(res.data)) {
        setUserFoodCart(res.data);
        await AsyncStorage.setItem(
          FOOD_CART_STORAGE_KEY,
          JSON.stringify(res.data),
        );
      }
    } catch (err) {
      console.warn("Fetch user food cart from backend warning:", err);
    }
  }, [user]);

  // Fetch wishlist from backend
  const fetchWishlist = useCallback(async () => {
    const userId = user?.user_id || user?.id;
    if (!userId) return;

    try {
      setLoadingWishlist(true);
      const res = await api.get(`/wishlist/${userId}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data)) {
        const normalizedData = data.map((item) => ({
          ...item,
          image: normalizeWishlistImage(item.image || item.wishlist_image),
        }));
        setWishlist(normalizedData);
        await AsyncStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(normalizedData),
        );
      }
    } catch (err) {
      console.warn("Fetch wishlist from backend warning:", err);
    } finally {
      setLoadingWishlist(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id || user?.user_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserFoodCart();
      fetchWishlist();
    }
  }, [user, fetchUserFoodCart, fetchWishlist]);

  // Add to food cart
  const addToFoodCart = useCallback(
    async (
      product: Record<string, any>,
      variant: any = null,
      size: string | null = null,
      qty = 1,
    ): Promise<boolean> => {
      const productId = product.product_id ?? product.id ?? product._id ?? "";
      const selectedVariant = variant || product.variants?.[0] || null;
      const selectedSize =
        size ??
        selectedVariant?.selectedSizes?.[0] ??
        selectedVariant?.weight ??
        product.variant_size ??
        "";
      const variantColor =
        selectedVariant?.colorName ||
        selectedVariant?.color ||
        product.variant_color ||
        "";

      // Parse image safely
      let image = "";
      if (typeof product.image === "string" && product.image.trim()) {
        image = product.image.trim().split(/\s+/)[0];
      } else if (Array.isArray(product.images) && product.images.length > 0) {
        const first = product.images[0];
        image =
          typeof first === "string"
            ? first.trim().split(/\s+/)[0]
            : first?.url || "";
      } else if (typeof product.images === "string" && product.images.trim()) {
        try {
          const parsed = JSON.parse(product.images);
          image =
            Array.isArray(parsed) && parsed.length > 0
              ? parsed[0]
              : product.images.trim();
        } catch {
          image = product.images.trim().split(/\s+/)[0];
        }
      } else if (selectedVariant?.images) {
        const vImg = selectedVariant.images;
        image =
          typeof vImg === "string"
            ? vImg.trim().split(/\s+/)[0]
            : Array.isArray(vImg) && vImg.length > 0
              ? vImg[0]
              : "";
      }

      const rawPrice =
        selectedVariant?.offerPrice ||
        selectedVariant?.price ||
        selectedVariant?.final_price ||
        product.final_price ||
        product.offer_price ||
        product.price ||
        product.mrp ||
        0;
      const price = parseFloat(String(rawPrice)) || 0;
      const mrp = parseFloat(String(product.mrp || rawPrice)) || price;

      const userId = user?.id || user?.user_id || "";
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newItem: CartItem = {
        id: cartItemId,
        product_id: String(productId),
        name: product.name || product.c_name || "Food Item",
        image: image || "",
        price,
        mrp,
        total_price: price * qty,
        quantity: qty,
        variant_size: selectedSize,
        variant_color: variantColor,
        chef_user_id:
          product.chef_user_id ||
          product.created_by ||
          product.created_by_user_id ||
          "",
        chef_id: product.chef_id || product.id_in_home_chefs || "",
        chef_name:
          product.chef_name ||
          product.homeChefName ||
          product.vendor_name ||
          "",
        chef_phone: product.chef_phone || product.created_by_phone || "",
        chef_email: product.chef_email || product.created_by_email || "",
      };

      // Optimistically update local cart state & storage
      setUserFoodCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            item.product_id === newItem.product_id &&
            item.variant_size === newItem.variant_size,
        );
        let updated: CartItem[];
        if (existingIndex > -1) {
          updated = [...prev];
          const exist = updated[existingIndex];
          const newQuantity = exist.quantity + qty;
          updated[existingIndex] = {
            ...exist,
            quantity: newQuantity,
            total_price: exist.price * newQuantity,
          };
        } else {
          updated = [newItem, ...prev];
        }
        AsyncStorage.setItem(
          FOOD_CART_STORAGE_KEY,
          JSON.stringify(updated),
        ).catch(console.error);
        return updated;
      });

      // Sync with backend API if user is authenticated
      if (userId) {
        try {
          const payload = {
            user_id: userId,
            product_id: productId,
            name: newItem.name,
            image: newItem.image,
            price: newItem.price,
            total_price: newItem.total_price,
            quantity: qty,
            variant_size: newItem.variant_size,
            variant_color: newItem.variant_color,
            chef_user_id: newItem.chef_user_id,
            chef_id: newItem.chef_id,
            chef_name: newItem.chef_name,
            chef_phone: newItem.chef_phone,
            chef_email: newItem.chef_email,
            ordered_by_name: user?.name || user?.username || "User",
            ordered_by_user_id: userId,
            ordered_by_email: user?.email || "",
            ordered_by_phone: user?.phone || user?.mobile || "",
          };
          const res = await api.post("/user-food", payload);
          if (res?.data?.id || res?.data?._id) {
            const backendId = String(res.data.id || res.data._id);
            setUserFoodCart((prev) =>
              prev.map((it) =>
                it.id === cartItemId ? { ...it, id: backendId } : it,
              ),
            );
          }
        } catch (apiErr) {
          console.warn(
            "Backend /user-food call error (saved locally):",
            apiErr,
          );
        }
      }

      return true;
    },
    [user],
  );

  // Remove from food cart
  const removeFromFoodCart = useCallback(async (id: string) => {
    setUserFoodCart((prev) => {
      const updated = prev.filter((it) => it.id !== id && it.product_id !== id);
      AsyncStorage.setItem(
        FOOD_CART_STORAGE_KEY,
        JSON.stringify(updated),
      ).catch(console.error);
      return updated;
    });

    try {
      await api.delete(`/user-food/${id}`);
    } catch (e) {
      console.warn("Delete /user-food failed:", e);
    }
  }, []);

  // Update food cart quantity
  const updateFoodCartQuantity = useCallback(
    async (id: string, qty: number) => {
      if (qty < 1) return;
      setUserFoodCart((prev) => {
        const updated = prev.map((it) =>
          it.id === id || it.product_id === id
            ? { ...it, quantity: qty, total_price: it.price * qty }
            : it,
        );
        AsyncStorage.setItem(
          FOOD_CART_STORAGE_KEY,
          JSON.stringify(updated),
        ).catch(console.error);
        return updated;
      });

      try {
        await api.put(`/user-food/${id}`, { quantity: qty });
      } catch (e) {
        console.warn("PUT /user-food quantity failed:", e);
      }
    },
    [],
  );

  // Clear food cart
  const clearUserFoodCart = useCallback(async () => {
    setUserFoodCart([]);
    await AsyncStorage.removeItem(FOOD_CART_STORAGE_KEY).catch(console.error);
    const userId = user?.user_id || user?.id;
    if (userId) {
      try {
        await api.delete(`/user-food/clear/${userId}`);
      } catch (e) {
        console.warn("Clear /user-food failed:", e);
      }
    }
  }, [user]);

  // Check if product is in wishlist
  const isInWishlist = useCallback(
    (productId: string | number) => {
      if (!productId) return false;
      const pId = String(productId);
      return wishlist.some(
        (w) =>
          String(w.product_id) === pId ||
          String(w.id) === pId ||
          String(w._id) === pId,
      );
    },
    [wishlist],
  );

  // Toggle wishlist
  const toggleWishlist = useCallback(
    async (
      product: Record<string, any>,
      variant: any = null,
      size: string | null = null,
    ): Promise<boolean> => {
      const productId = String(
        product.product_id ?? product.id ?? product._id ?? "",
      );
      if (!productId) return false;

      const userId = user?.user_id || user?.id;

      const currentlyIn = wishlist.some(
        (w) =>
          String(w.product_id) === productId ||
          String(w.id) === productId ||
          String(w._id) === productId,
      );

      if (currentlyIn) {
        // Remove from wishlist
        const updated = wishlist.filter(
          (w) =>
            String(w.product_id) !== productId &&
            String(w.id) !== productId &&
            String(w._id) !== productId,
        );
        setWishlist(updated);
        await AsyncStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(updated),
        ).catch(console.error);

        if (userId) {
          try {
            await api.delete(`/wishlist/${userId}/${productId}`);
          } catch (err) {
            console.warn("Failed to delete wishlist item on backend:", err);
          }
        }
        return false;
      } else {
        // Add to wishlist
        const selectedVariant = variant || product.variants?.[0] || null;
        const selectedSize =
          size ??
          selectedVariant?.selectedSizes?.[0] ??
          selectedVariant?.weight ??
          product.variant_size ??
          "";
        const variantColor =
          selectedVariant?.colorName ||
          selectedVariant?.color ||
          product.variant_color ||
          "";

        let image = "";
        if (typeof product.image === "string" && product.image.trim()) {
          image = product.image.trim().split(/\s+/)[0];
        } else if (Array.isArray(product.images) && product.images.length > 0) {
          const first = product.images[0];
          image =
            typeof first === "string"
              ? first.trim().split(/\s+/)[0]
              : first?.url || "";
        } else if (typeof product.images === "string" && product.images.trim()) {
          try {
            const parsed = JSON.parse(product.images);
            image =
              Array.isArray(parsed) && parsed.length > 0
                ? parsed[0]
                : product.images.trim();
          } catch {
            image = product.images.trim().split(/\s+/)[0];
          }
        } else if (selectedVariant?.images) {
          const vImg = selectedVariant.images;
          image =
            typeof vImg === "string"
              ? vImg.trim().split(/\s+/)[0]
              : Array.isArray(vImg) && vImg.length > 0
                ? vImg[0]
                : "";
        }

        const rawPrice =
          selectedVariant?.offerPrice ||
          selectedVariant?.price ||
          selectedVariant?.final_price ||
          product.final_price ||
          product.offer_price ||
          product.price ||
          product.mrp ||
          0;
        const price = parseFloat(String(rawPrice)) || 0;
        const mrp = parseFloat(String(product.mrp || rawPrice)) || price;

        const newItem: WishlistItem = {
          id: `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          product_id: productId,
          user_id: userId ? String(userId) : undefined,
          name: product.name || product.c_name || "Food Dish",
          image: image || "",
          price,
          mrp,
          total_price: price,
          variant_size: selectedSize,
          variant_color: variantColor,
          chef_name:
            product.chef_name ||
            product.homeChefName ||
            product.vendor_name ||
            "",
          rating: product.rating || product.average_rating || 4.5,
          product,
        };

        const previousWishlist = wishlist;
        const updated = [newItem, ...previousWishlist];
        setWishlist(updated);
        await AsyncStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(updated),
        ).catch(console.error);

        if (userId) {
          try {
            const response = await api.post("/wishlist", {
              user_id: userId,
              product_id: productId,
              variant_color: variantColor,
              variant_size: selectedSize,
              image: image,
              email: user?.email || "",
              price: price,
              total_price: price,
            });

            if (response.data?.action === "removed") {
              const serverUpdated = updated.filter(
                (item) => item.id !== newItem.id,
              );
              setWishlist(serverUpdated);
              await AsyncStorage.setItem(
                WISHLIST_STORAGE_KEY,
                JSON.stringify(serverUpdated),
              );
              return false;
            }

            const serverId = response.data?.id;
            if (serverId !== undefined && serverId !== null) {
              const serverUpdated = updated.map((item) =>
                item.id === newItem.id
                  ? { ...item, id: String(serverId) }
                  : item,
              );
              setWishlist(serverUpdated);
              await AsyncStorage.setItem(
                WISHLIST_STORAGE_KEY,
                JSON.stringify(serverUpdated),
              );
            }
          } catch (err) {
            setWishlist(previousWishlist);
            await AsyncStorage.setItem(
              WISHLIST_STORAGE_KEY,
              JSON.stringify(previousWishlist),
            ).catch(console.error);
            console.warn("Failed to sync wishlist item with backend:", err);
            return false;
          }
        }
        return true;
      }
    },
    [user, wishlist],
  );

  // Place food order
  const placeFoodOrder = useCallback(
    async (orderData: Record<string, any>) => {
      const res = await api.post("/user-food-orders", orderData);
      if (!orderData.isBuyNow) {
        await clearUserFoodCart();
      }
      return res.data;
    },
    [clearUserFoodCart],
  );

  return (
    <StoreContext.Provider
      value={{
        chefFoodsCache,
        setChefFoodsCache,
        lastChefFoodsFetchTime,
        setLastChefFoodsFetchTime,
        categoriesCache,
        setCategoriesCache,
        userFoodCart,
        addToFoodCart,
        removeFromFoodCart,
        updateFoodCartQuantity,
        clearUserFoodCart,
        fetchUserFoodCart,
        placeFoodOrder,
        wishlist,
        loadingWishlist,
        fetchWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
