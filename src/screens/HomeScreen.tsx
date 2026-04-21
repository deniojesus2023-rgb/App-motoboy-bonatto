import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { trpc } from "../lib/trpc";
import { useGps } from "../hooks/useGps";
import { usePushNotifications } from "../hooks/usePushNotifications";
import OrderCard from "../components/OrderCard";

const LOGO_URL =
  "https://cdn.jsdelivr.net/gh/deniojesus2023-rgb/assets-bonatto@b486a7ddfc7f19e8ceb220c8d4528cbf2284b2f1/bonatto-logo-driver.jpg";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function HomeScreen() {
  const { token, driver, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "history">("home");
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | null>(null);

  // Queries tRPC
  const todayStats = trpc.drivers.todayStats.useQuery(
    { token: token! },
    { enabled: !!token && !!driver, refetchInterval: 30000 }
  );

  const assignedOrders = trpc.drivers.assignedOrders.useQuery(
    { token: token! },
    { enabled: !!token && !!driver, refetchInterval: 10000 }
  );

  const todayDeliveries = trpc.drivers.todayDeliveries.useQuery(
    { token: token! },
    { enabled: !!token && !!driver && activeTab === "history", refetchInterval: 30000 }
  );

  // GPS
  const { gps, toggle: toggleGps } = useGps(token, null);

  // Push notifications
  usePushNotifications(token);

  // Mutation de confirmar entrega
  const confirmDelivery = trpc.drivers.confirmDelivery.useMutation({
    onSuccess: () => {
      assignedOrders.refetch();
      todayStats.refetch();
      Alert.alert("Entrega confirmada!", "O cliente foi notificado. 🍕");
    },
    onError: (err: any) => {
      Alert.alert("Erro", err.message ?? "Não foi possível confirmar a entrega");
    },
    onSettled: () => {
      setConfirmingOrderId(null);
    },
  });

  function handleConfirm(orderId: number) {
    setConfirmingOrderId(orderId);
    confirmDelivery.mutate({ token: token!, orderId });
  }

  function handleLogout() {
    Alert.alert("Sair", "Deseja sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          if (gps.active) toggleGps();
          signOut();
        },
      },
    ]);
  }

  const isRefreshing = todayStats.isFetching || assignedOrders.isFetching;
  const stats = todayStats.data;
  const orders = (assignedOrders.data ?? []) as any[];
  const deliveries = (todayDeliveries.data ?? []) as any[];

  function onRefresh() {
    todayStats.refetch();
    assignedOrders.refetch();
    if (activeTab === "history") todayDeliveries.refetch();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6E0D12" />

      {/* Header com gradiente Bonatto */}
      <View style={styles.header}>
        {/* Grid decorativo */}
        <View style={styles.headerGrid} />

        <View style={styles.headerContent}>
          {/* Topo: logo + nome + botão sair */}
          <View style={styles.headerTop}>
            <View style={styles.driverInfo}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} />
              <View>
                <Text style={styles.welcomeText}>Bem-vindo,</Text>
                <Text style={styles.driverName}>{driver?.name ?? "Motoboy"}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* KPI Cards do dia */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>📦</Text>
              <Text style={styles.kpiValue}>{stats?.deliveries ?? 0}</Text>
              <Text style={styles.kpiLabel}>Entregas</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>💰</Text>
              <Text style={[styles.kpiValue, styles.kpiGreen]}>
                {formatCurrency(stats?.earnings ?? 0)}
              </Text>
              <Text style={styles.kpiLabel}>Ganhos</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>⭐</Text>
              <Text style={[styles.kpiValue, styles.kpiYellow]}>
                {stats?.avgRating && stats.avgRating > 0
                  ? stats.avgRating.toFixed(1)
                  : "—"}
              </Text>
              <Text style={styles.kpiLabel}>Avaliação</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "home" && styles.tabActive]}
          onPress={() => setActiveTab("home")}
        >
          <Text style={[styles.tabText, activeTab === "home" && styles.tabTextActive]}>
            Pedidos Ativos
            {orders.length > 0 && (
              <Text style={styles.tabBadge}> {orders.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
            Hoje
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#6E0D12"
            colors={["#6E0D12"]}
          />
        }
      >
        {/* Aba Pedidos Ativos */}
        {activeTab === "home" && (
          <>
            {/* Botão GPS */}
            <TouchableOpacity
              style={[styles.gpsButton, gps.active ? styles.gpsButtonActive : styles.gpsButtonInactive]}
              onPress={toggleGps}
              activeOpacity={0.85}
            >
              <Text style={styles.gpsButtonIcon}>{gps.active ? "📡" : "📍"}</Text>
              <Text style={styles.gpsButtonText}>
                {gps.active ? "GPS Ativo — Toque para parar" : "Iniciar GPS"}
              </Text>
              {gps.active && (
                <View style={styles.gpsPulse} />
              )}
            </TouchableOpacity>

            {gps.error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {gps.error}</Text>
              </View>
            )}

            {/* Lista de pedidos */}
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛵</Text>
                <Text style={styles.emptyTitle}>Nenhum pedido no momento</Text>
                <Text style={styles.emptySubtitle}>
                  Quando um pedido for atribuído a você, ele aparecerá aqui
                </Text>
              </View>
            ) : (
              orders.map((orderData: any) => (
                <OrderCard
                  key={orderData.order.id}
                  order={orderData.order}
                  items={orderData.items ?? []}
                  onConfirm={handleConfirm}
                  isConfirming={confirmingOrderId === orderData.order.id}
                />
              ))
            )}
          </>
        )}

        {/* Aba Histórico do Dia */}
        {activeTab === "history" && (
          <>
            {deliveries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Nenhuma entrega hoje</Text>
                <Text style={styles.emptySubtitle}>
                  Suas entregas do dia aparecerão aqui após confirmação
                </Text>
              </View>
            ) : (
              deliveries.map((delivery: any) => (
                <View key={delivery.id} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyOrderId}>Pedido #{delivery.id}</Text>
                    <Text style={styles.historyAddress} numberOfLines={1}>
                      {delivery.deliveryAddress ?? "—"}
                    </Text>
                    <Text style={styles.historyCustomer}>{delivery.customerName}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyTotal}>
                      {formatCurrency(Number(delivery.total))}
                    </Text>
                    <View style={styles.deliveredBadge}>
                      <Text style={styles.deliveredBadgeText}>Entregue</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0204",
  },
  header: {
    backgroundColor: "#6E0D12",
    paddingBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  headerGrid: {
    position: "absolute",
    inset: 0,
    opacity: 0.1,
    backgroundColor: "transparent",
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  welcomeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  driverName: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  logoutText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  kpiIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  kpiValue: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
  },
  kpiGreen: {
    color: "#86efac",
    fontSize: 14,
  },
  kpiYellow: {
    color: "#fde047",
  },
  kpiLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#1a0305",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#6E0D12",
  },
  tabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  tabBadge: {
    color: "#ff6b6b",
    fontWeight: "900",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 22,
    marginBottom: 16,
    gap: 10,
    position: "relative",
    overflow: "hidden",
  },
  gpsButtonActive: {
    backgroundColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  gpsButtonInactive: {
    backgroundColor: "#6E0D12",
    shadowColor: "#6E0D12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  gpsButtonIcon: {
    fontSize: 22,
  },
  gpsButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  gpsPulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.8)",
    right: 16,
  },
  errorBanner: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: "#1f0508",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(110,13,18,0.3)",
  },
  historyLeft: {
    flex: 1,
    marginRight: 12,
  },
  historyOrderId: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  historyAddress: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  historyCustomer: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  historyTotal: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 14,
  },
  deliveredBadge: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deliveredBadgeText: {
    color: "#6ee7b7",
    fontSize: 11,
    fontWeight: "600",
  },
});
