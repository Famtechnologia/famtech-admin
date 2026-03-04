"use client";

import { useEffect, useState, useCallback } from "react";

import { socket as soc } from "../services/socket";
import { Socket } from "socket.io-client";

/**
 * Hook for managing chat socket connections in admin backend
 */
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  // Set socket instance once on mount
  useEffect(() => {
    setSocket(soc);
  }, []);

  // Set up listeners when socket is available
  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      setError(`Connection error: ${err.message}`);
    });

    socket.on("support_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("new_support_request", (data) => {
      setCustomers((prev) => [
        ...prev,
        { userId: data.userId, message: data.message, timestamp: data?.timestamp || new Date() },
      ]);
    });

    // Cleanup listeners on unmount or socket change
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("support_message");
      socket.off("new_support_request");
      socket.disconnect();
    };
  }, [socket]);

  const joinChat = useCallback(
    (userId: string) => {
      if (!socket?.connected) {
        setError("Not connected to chat server");
        return;
      }
      socket.emit("join_user_chat", userId);
    },
    [socket],
  );

  // Send message handler
  const reply = useCallback(
    (text: string, id: string, agent: string) => {
      if (!socket?.connected) {
        setError("Not connected to chat server");
        return;
      }

      socket.emit("send_to_user", { userId: id, message: text, agentId: agent });
    },
    [socket],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    socket,
    isConnected,
    messages,
    error,
    reply,
    clearMessages,
    joinChat,
    customers,
  };
};

