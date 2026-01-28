"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { getData } from "@/actions/get";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(null);
  const [showPrice, setShowPrice] = useState(false);
  const router = useRouter();
  const isInitializedRef = useRef(false);

  // Custom setAuth function that updates both state and cookies
  const setAuth = useCallback((newAuthData) => {
    if (newAuthData) {
      // If there's auth data, set both state and cookies
      Cookies.set("auth", JSON.stringify(newAuthData), {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict"
      });
      setAuthState(newAuthData);
    } else {
      // If null/undefined, clear both state and cookies
      Cookies.remove("auth");
      setAuthState(null);
    }
  }, []);

  // Load initial auth state from cookies - only once
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const storedAuth = Cookies.get("auth");
    const fetchData = async (data) => {
      try {
        const userData = await getData(`/api/users/${data?.id}`, "user");
        if (userData) {
          setAuth(userData);
        }
      } catch (error) {
        // Handle error silently
      }
    };
    if (storedAuth) {
      fetchData(JSON.parse(storedAuth));
    }
    const fetchPriceShow = async () => {
      try {
        const show = await getData("/api/price-switch", "price-switch");
        setShowPrice(Boolean(show?.show));
      } catch (error) {}
    };
    fetchPriceShow();
  }, [setAuth]);

  // Login function
  const login = useCallback((userData) => {
    setAuth(userData);
    router.push("/");
  }, [setAuth, router]);

  // Logout function
  const logout = useCallback(() => {
    setAuth(null);
    router.push("/");
  }, [setAuth, router]);

  return (
    <AuthContext.Provider value={{ showPrice, auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
