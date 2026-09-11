import { createContext, ReactNode, useContext, useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
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
    final_price?: number;
    stock?: number;
    images?: string;
  }[];
  chef_name?: string;
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

interface CategoryItem {
  c_name?: string;
  category_type?: string;
  name?: string;
  image?: string | string[];
  images?: string | string[];
  [key: string]: any;
}

interface CartItem extends Product {
  quantity: number;
}

interface StoreContextType {
  chefFoodsCache: Product[];
  setChefFoodsCache: (products: Product[]) => void;
  lastChefFoodsFetchTime: number | null;
  setLastChefFoodsFetchTime: (time: number | null) => void;
  categoriesCache: CategoryItem[];
  setCategoriesCache: (categories: CategoryItem[]) => void;
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1) => {
    const productId = String(product.id);
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => String(item.id) === productId,
      );

      if (!existingItem) {
        return [
          ...currentItems,
          { ...product, id: productId, quantity: safeQuantity },
        ];
      }

      return currentItems.map((item) =>
        String(item.id) === productId
          ? { ...item, quantity: item.quantity + safeQuantity }
          : item,
      );
    });
  };

  return (
    <StoreContext.Provider
      value={{
        chefFoodsCache,
        setChefFoodsCache,
        lastChefFoodsFetchTime,
        setLastChefFoodsFetchTime,
        categoriesCache,
        setCategoriesCache,
        cartItems,
        addToCart,
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
