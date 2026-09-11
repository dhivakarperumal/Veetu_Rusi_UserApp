import { useLocation } from "@/context/LocationContext";

export function useFetchLocation() {
  const {
    fetchingLocation,
    locationError,
    fetchLocation,
    location,
    hasLocation,
    isProductDeliverable,
    calculateDistance,
  } = useLocation();

  return {
    fetchingLocation,
    locationError,
    fetchLocation,
    location,
    hasLocation,
    isProductDeliverable,
    calculateDistance,
  };
}
