"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearTokens, getDeviceId, setTokens } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const me = await api.get("/auth/me/");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem("hm_access")) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, [loadMe]);

  const login = useCallback(async (identifier, password) => {
    const data = await api.post(
      "/auth/login/",
      {
        identifier,
        password,
        device_id: getDeviceId(),
        device_label: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
      },
      { auth: false }
    );
    setTokens(data.tokens);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post("/auth/register/", payload, { auth: false });
    setTokens(data.tokens);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
