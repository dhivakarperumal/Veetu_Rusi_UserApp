import React, { createContext, ReactNode, useContext, useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  status?: string;
  final_price?: number;
  offer_price?: number;
  mrp?: number;
  offer?: number;
  variants?: Array<{
    colorName: string;
    selectedSizes?: string[];
  }>;
  chef_name?: string;
  delivery_radius?: number;
  latitude?: number;
  longitude?: number;
  area_name?: string;
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
