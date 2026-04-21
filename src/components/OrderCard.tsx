import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";

interface OrderItem {
  id: number;
  quantity: number;
  productName: string;
  subtotal: string | number;
}

interface Order {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryComplement: string | null;
  total: string | number;
  paymentMethod: string | null;
  paymentStatus: string | null;
}

interface OrderCardProps {
  order: Order;
  items: OrderItem[];
  onConfirm: (orderId: number) => void;
  isConfirming: boolean;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function paymentLabel(method: string | null, status: string | null) {
  const m =
    method === "cash"
      ? "Dinheiro"
      : method === "pix"
      ? "Pix"
      : method === "credit_card"
      ? "Cartão de crédito"
      : method === "debit_card"
      ? "Cartão de débito"
      : method ?? "—";
  const s = status === "paid" ? "✅ Pago" : "⏳ Cobrar na entrega";
  return `${m} — ${s}`;
}

export default function OrderCard({ order, items, onConfirm, isConfirming }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  function openMaps(address: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o Google Maps"));
  }

  function openWaze(address: string) {
    const url = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      // Fallback para URL universal do Waze
      Linking.openURL(`waze://?q=${encodeURIComponent(address)}&navigate=yes`).catch(() =>
        Alert.alert("Erro", "Não foi possível abrir o Waze")
      );
    });
  }

  function callCustomer(phone: string) {
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert("Erro", "Não foi possível ligar"));
  }

  function handleConfirm() {
    Alert.alert(
      "Confirmar Entrega",
      `Confirmar entrega do Pedido #${order.id}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: () => onConfirm(order.id),
        },
      ]
    );
  }

  const address = order.deliveryAddress ?? "Endereço não informado";

  return (
    <View style={styles.card}>
      {/* Header do card */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.packageIcon}>📦</Text>
          <Text style={styles.orderId}>Pedido #{order.id}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Em entrega</Text>
          </View>
          <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {/* Resumo sempre visível */}
      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Text>📍</Text>
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.addressText}>{address}</Text>
          {order.deliveryComplement ? (
            <Text style={styles.complementText}>{order.deliveryComplement}</Text>
          ) : null}
          <Text style={styles.customerNameSmall}>{order.customerName}</Text>
        </View>
        <Text style={styles.totalText}>{formatCurrency(Number(order.total))}</Text>
      </View>

      {/* Detalhes expandíveis */}
      {expanded && (
        <View style={styles.details}>
          {/* Cliente */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cliente</Text>
            <Text style={styles.detailValue}>{order.customerName ?? "—"}</Text>
          </View>
          {order.customerPhone && (
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={() => callCustomer(order.customerPhone!)}
            >
              <Text style={styles.phoneButtonText}>📞 Ligar para {order.customerPhone}</Text>
            </TouchableOpacity>
          )}

          {/* Itens do pedido */}
          {items.length > 0 && (
            <View style={styles.itemsContainer}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {item.quantity}x {item.productName}
                  </Text>
                  <Text style={styles.itemSubtotal}>
                    {formatCurrency(Number(item.subtotal))}
                  </Text>
                </View>
              ))}
              <View style={styles.itemTotalRow}>
                <Text style={styles.itemTotalLabel}>Total</Text>
                <Text style={styles.itemTotalValue}>
                  {formatCurrency(Number(order.total))}
                </Text>
              </View>
            </View>
          )}

          {/* Pagamento */}
          <Text style={styles.paymentText}>
            💳 {paymentLabel(order.paymentMethod, order.paymentStatus)}
          </Text>

          {/* Botões de navegação */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.mapsButton]}
              onPress={() => openMaps(address)}
            >
              <Text style={styles.navButtonText}>🗺 Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, styles.wazeButton]}
              onPress={() => openWaze(address)}
            >
              <Text style={styles.navButtonText}>🚗 Waze</Text>
            </TouchableOpacity>
          </View>

          {/* Botão de confirmar entrega */}
          <TouchableOpacity
            style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={isConfirming}
            activeOpacity={0.8}
          >
            {isConfirming ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>✅ Confirmar Entrega</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f0508",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(110,13,18,0.4)",
    overflow: "hidden",
    marginBottom: 12,
  },
  cardHeader: {
    backgroundColor: "rgba(110,13,18,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageIcon: {
    fontSize: 16,
  },
  orderId: {
    fontWeight: "700",
    fontSize: 14,
    color: "#ffffff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "rgba(30,64,175,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: "#93c5fd",
    fontSize: 11,
    fontWeight: "600",
  },
  chevron: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  summary: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(110,13,18,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    flex: 1,
  },
  addressText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
  },
  complementText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  customerNameSmall: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  totalText: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 14,
  },
  details: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  phoneButton: {
    paddingVertical: 6,
  },
  phoneButtonText: {
    color: "#ff6b6b",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  itemsContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    flex: 1,
  },
  itemSubtotal: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
  },
  itemTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 6,
    marginTop: 4,
  },
  itemTotalLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  itemTotalValue: {
    color: "#34d399",
    fontWeight: "700",
    fontSize: 13,
  },
  paymentText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  mapsButton: {
    backgroundColor: "rgba(59,130,246,0.2)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
  },
  wazeButton: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },
  navButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#6E0D12",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
});
