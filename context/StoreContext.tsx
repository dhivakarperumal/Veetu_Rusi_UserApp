import React, { createContext, ReactNode, useContext, useState } from "react";

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
  variants?: Array<{
    colorName?: string;
    selectedSizes?: string[];
    weight?: string;
    price?: number;
    offer?: number;
    final_price?: number;
    stock?: number;
    images?: string;
  }>;
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

interface StoreContextType {
  chefFoodsCache: Product[];
  setChefFoodsCache: (products: Product[]) => void;
  lastChefFoodsFetchTime: number | null;
  setLastChefFoodsFetchTime: (time: number | null) => void;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [chefFoodsCache, setChefFoodsCache] = useState<Product[]>([]);
  const [lastChefFoodsFetchTime, setLastChefFoodsFetchTime] = useState<
    number | null
  >(null);

  return (
    <StoreContext.Provider
      value={{
        chefFoodsCache,
        setChefFoodsCache,
        lastChefFoodsFetchTime,
        setLastChefFoodsFetchTime,
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
