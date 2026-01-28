"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { backUrl, wsUrl } from "@/lib/utils";
import useAudio from "@/hooks/use-audio";

const AdminSocketContext = createContext(null);

// WebSocket reconnection constants
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export function AdminSocketProvider({ children }) {
  const { playSound } = useAudio();
  const playSoundRef = useRef(playSound);
  const [newOrders, setNewOrders] = useState([]);
  const [reload, setReload] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountingRef = useRef(false);

  // Keep ref updated
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  const normalizeWsValue = useCallback((value) => {
    if (!value) {
      return "";
    }

    let normalized = value.trim();
    if (!normalized) {
      return "";
    }

    normalized = normalized.replace(/^wss?:\/\/https?:\/\//i, (match) =>
      match.toLowerCase().startsWith("wss://") ? "wss://" : "ws://"
    );

    if (/^https?:\/\//i.test(normalized)) {
      normalized = normalized.replace(/^http/i, "ws");
    } else if (!/^wss?:\/\//i.test(normalized)) {
      normalized = `ws://${normalized}`;
    }

    try {
      const url = new URL(normalized);
      if (url.pathname === "" || url.pathname === "/") {
        url.pathname = "/ws";
      }
      return url.toString();
    } catch (error) {
      console.warn("Invalid WebSocket URL:", value, error);
      return "";
    }
  }, []);

  const resolveWsUrl = useCallback(() => {
    if (wsUrl) {
      return normalizeWsValue(wsUrl);
    }

    if (!backUrl) {
      return "";
    }

    return normalizeWsValue(backUrl);
  }, [normalizeWsValue]);

  const scheduleReconnect = useCallback(() => {
    if (isUnmountingRef.current) return;

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("Максимальное количество попыток переподключения WebSocket достигнуто");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, etc., max 30s
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    );
    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountingRef.current) {
        connect();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (isUnmountingRef.current) return;

    const socketUrl = resolveWsUrl();
    if (!socketUrl) {
      console.warn("WebSocket URL is not configured");
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    let socket;
    try {
      socket = new WebSocket(socketUrl);
      socketRef.current = socket;
    } catch (error) {
      console.warn("Ошибка WebSocket:", error);
      scheduleReconnect();
      return;
    }

    // Когда соединение открывается
    socket.onopen = () => {
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    };

    // Когда получено сообщение
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const order = data?.message;
        if (order?.order_type) {
          playSoundRef.current("sound1");
          toast.success("У вас поступил новый заказ!!", {
            description: `Заказ #${order?.id || "N/A"}`,
            position: "top-center",
            duration: 5000,
          });

          setNewOrders((prev) => [...prev, order]);
        }
      } catch (error) {
        console.error("Ошибка при разборе сообщения WebSocket:", error);
      }
    };

    // Когда соединение закрывается
    socket.onclose = (event) => {
      socketRef.current = null;

      // Auto-reconnect unless it was a clean close (1000) or component is unmounting
      if (event.code !== 1000 && !isUnmountingRef.current) {
        scheduleReconnect();
      }
    };

    // При возникновении ошибки
    socket.onerror = (error) => {
      console.warn("Ошибка WebSocket:", error);
    };
  }, [resolveWsUrl, scheduleReconnect]);

  useEffect(() => {
    isUnmountingRef.current = false;
    connect();

    // Очистка при размонтировании
    return () => {
      isUnmountingRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounting");
        socketRef.current = null;
      }
    };
  }, [connect]);

  const reloadFunc = () => {
    setReload(!reload);
  };

  return (
    <AdminSocketContext.Provider
      value={{ newOrders, setNewOrders, reload, reloadFunc }}
    >
      {children}
    </AdminSocketContext.Provider>
  );
}

export function useAdminSocket() {
  return useContext(AdminSocketContext);
}
