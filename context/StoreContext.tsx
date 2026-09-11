import api from "@/app/api";
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

  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Load cart from AsyncStorage on startup
  useEffect(() => {
    const loadStoredCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(FOOD_CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setUserFoodCart(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load food cart from storage:", err);
      }
    };
    loadStoredCart();
  }, []);

  // Fetch cart from backend if user is authenticated
  const fetchUserFoodCart = useCallback(async () => {
    const userId = user?.id || user?.user_id;
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

  useEffect(() => {
    if (user?.id || user?.user_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserFoodCart();
    }
  }, [user, fetchUserFoodCart]);

  // Add to food cart
  const addToFoodCart = useCallback(
    async (
      product: Record<string, any>,
      variant: any = null,
      size: string | null = null,
      qty = 1,
    ): Promise<boolean> => {
      const productId =
        product.product_id ?? product.id ?? product._id ?? "";
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
          console.warn("Backend /user-food call error (saved locally):", apiErr);
        }
      }

      return true;
    },
    [user],
  );

  // Remove from food cart
  const removeFromFoodCart = useCallback(
    async (id: string) => {
      setUserFoodCart((prev) => {
        const updated = prev.filter(
          (it) => it.id !== id && it.product_id !== id,
        );
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
    },
    [],
  );

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
    const userId = user?.id || user?.user_id;
    if (userId) {
      try {
        await api.delete(`/user-food/clear/${userId}`);
      } catch (e) {
        console.warn("Clear /user-food failed:", e);
      }
    }
  }, [user]);

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
