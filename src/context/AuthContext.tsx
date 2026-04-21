import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bonatto_driver_token";
const DRIVER_KEY = "bonatto_driver_info";

interface Driver {
  id: number;
  name: string;
}

interface AuthContextType {
  token: string | null;
  driver: Driver | null;
  isLoading: boolean;
  signIn: (token: string, driver: Driver) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  driver: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredCredentials();
  }, []);

  async function loadStoredCredentials() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedDriver = await SecureStore.getItemAsync(DRIVER_KEY);
      if (storedToken && storedDriver) {
        setToken(storedToken);
        setDriver(JSON.parse(storedDriver));
      }
    } catch (e) {
      console.error("Erro ao carregar credenciais:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(newToken: string, driverInfo: Driver) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(DRIVER_KEY, JSON.stringify(driverInfo));
    setToken(newToken);
    setDriver(driverInfo);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(DRIVER_KEY);
    setToken(null);
    setDriver(null);
  }

  return (
    <AuthContext.Provider value={{ token, driver, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
