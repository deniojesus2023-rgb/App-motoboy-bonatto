import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { trpc } from "../lib/trpc";

// Configuração global de como as notificações são exibidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(token: string | null) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const savePushMutation = trpc.drivers.saveExpoPushToken.useMutation();

  useEffect(() => {
    if (!token) return;
    registerForPushNotifications();

    // Listener para notificações recebidas com app aberto
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notificação recebida:", notification);
    });

    // Listener para quando o usuário toca na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notificação tocada:", response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token]);

  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log("Notificações push requerem dispositivo físico");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão de notificação negada");
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Bonatto Motoboy",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6E0D12",
        sound: "default",
      });
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      setExpoPushToken(pushToken);

      if (token && pushToken) {
        await savePushMutation.mutateAsync({ token, expoPushToken: pushToken });
        setIsRegistered(true);
      }
    } catch (err) {
      console.error("Erro ao obter push token:", err);
    }
  }

  return { expoPushToken, isRegistered };
}
