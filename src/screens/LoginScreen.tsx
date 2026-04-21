import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { trpc } from "../lib/trpc";

const LOGO_URL =
  "https://cdn.jsdelivr.net/gh/deniojesus2023-rgb/assets-bonatto@b486a7ddfc7f19e8ceb220c8d4528cbf2284b2f1/bonatto-logo-driver.jpg";

export default function LoginScreen() {
  const [tokenInput, setTokenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  // Usa a mesma procedure que o site usa para validar o token
  const meQuery = trpc.drivers.myActiveOrder.useQuery(
    { token: tokenInput.trim() },
    {
      enabled: false, // só executa manualmente
      retry: false,
    }
  );

  async function handleLogin() {
    const token = tokenInput.trim();
    if (!token) {
      Alert.alert("Atenção", "Cole o token de acesso fornecido pelo administrador.");
      return;
    }

    setIsLoading(true);
    try {
      // Valida o token chamando a procedure myActiveOrder
      const result = await meQuery.refetch();
      if (result.data?.driver) {
        await signIn(token, {
          id: result.data.driver.id,
          name: result.data.driver.name,
        });
      } else {
        Alert.alert("Token inválido", "Verifique o token e tente novamente. Se o problema persistir, solicite um novo token ao administrador.");
      }
    } catch (err: any) {
      Alert.alert("Token inválido", "Verifique o token e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0204" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo e título */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} />
            </View>
            <Text style={styles.title}>App do Motoboy</Text>
            <Text style={styles.subtitle}>Bonatto Pizza</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Text style={styles.label}>Token de Acesso</Text>
            <TextInput
              style={styles.input}
              value={tokenInput}
              onChangeText={setTokenInput}
              placeholder="Cole seu token aqui..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Text style={styles.hint}>
              O token é fornecido pelo administrador da Bonatto Pizza no painel de controle.
            </Text>

            <TouchableOpacity
              style={[styles.button, (!tokenInput.trim() || isLoading) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!tokenInput.trim() || isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Instrução para o admin */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Como obter o token?</Text>
            <Text style={styles.infoText}>
              1. O administrador acessa o painel em bonatto.com.br/admin{"\n"}
              2. Na seção de Motoboys, cria ou visualiza o motoboy{"\n"}
              3. Copia o token de acesso e envia para você
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0204",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#6E0D12",
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#6E0D12",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
  },
  form: {
    gap: 8,
    marginBottom: 24,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: "#ffffff",
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  hint: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#6E0D12",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#6E0D12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 17,
  },
  infoBox: {
    backgroundColor: "rgba(110,13,18,0.15)",
    borderWidth: 1,
    borderColor: "rgba(110,13,18,0.3)",
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  infoTitle: {
    color: "#ff6b6b",
    fontWeight: "700",
    fontSize: 13,
  },
  infoText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 19,
  },
});
