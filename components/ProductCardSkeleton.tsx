import { StyleProp, View, ViewStyle } from "react-native";

interface ProductCardSkeletonProps {
  imageHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export default function ProductCardSkeleton({
  imageHeight = 120,
  style,
}: ProductCardSkeletonProps) {
  return (
    <View
      className="rounded-[18px] border border-borderLight bg-white p-2.5"
      style={style}
    >
      <View
        className="w-full rounded-[16px] bg-grayLight"
        style={{ height: imageHeight }}
      />
      <View className="mt-2 h-4 w-3/4 rounded bg-grayLight" />
      <View className="mt-2 h-3 w-1/2 rounded bg-grayLight" />
      <View className="mt-3 flex-row items-center justify-between">
        <View className="h-4 w-16 rounded bg-grayLight" />
        <View className="h-9 w-9 rounded-full bg-grayLight" />
      </View>
    </View>
  );
}