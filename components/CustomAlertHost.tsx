import { colors } from "@/config/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    Text,
    View,
    type AlertButton,
} from "react-native";

type AlertRequest = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

let pendingRequest: AlertRequest | null = null;
let requestListener: ((request: AlertRequest) => void) | null = null;

export const customAlert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const request = {
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: "OK" }],
    };

    if (requestListener) {
      requestListener(request);
    } else {
      pendingRequest = request;
    }
  },
};

export default function CustomAlertHost() {
  const [request, setRequest] = useState<AlertRequest | null>(() => {
    const initialRequest = pendingRequest;
    pendingRequest = null;
    return initialRequest;
  });

  useEffect(() => {
    requestListener = setRequest;

    return () => {
      requestListener = null;
    };
  }, []);

  const close = () => setRequest(null);

  const handleButtonPress = (button: AlertButton) => {
    close();
    button.onPress?.();
  };

  return (
    <Modal
      visible={Boolean(request)}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <Pressable className="absolute inset-0" onPress={close} />
        {request && (
          <View className="w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white shadow-2xl">
            <View className="items-center px-6 pb-2 pt-6">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <MaterialCommunityIcons
                  name="bell-ring-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>
              <Text className="text-center text-[20px] font-black text-text">
                {request.title}
              </Text>
              {request.message ? (
                <Text className="mt-2 text-center text-[14px] leading-5 text-textSecondary">
                  {request.message}
                </Text>
              ) : null}
            </View>

            <View className="mt-4 flex-row border-t border-borderLight">
              {request.buttons.map((button, index) => (
                <Pressable
                  key={`${button.text || "button"}-${index}`}
                  className={`flex-1 items-center px-3 py-4 active:bg-gray ${
                    index > 0 ? "border-l border-borderLight" : ""
                  }`}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    className={`text-[14px] font-bold ${
                      button.style === "destructive"
                        ? "text-error"
                        : index === request.buttons.length - 1
                          ? "text-primary"
                          : "text-textSecondary"
                    }`}
                  >
                    {button.text || "OK"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
