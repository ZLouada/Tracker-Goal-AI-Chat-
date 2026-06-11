import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ type: string; data: any }>;
  fileName?: string; // Shown when a file was attached
  timestamp: Date;
}

export function useChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! 👋 I'm your TrackerGoal AI assistant. I can help you create goals, set tasks, build execution plans, and even analyze uploaded documents. What are you working on?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Shared action handler ───
  const handleActions = useCallback(
    (actions: Array<{ type: string; data: any }>) => {
      if (!actions || actions.length === 0) return;
      for (const action of actions) {
        switch (action.type) {
          case "createGoal":
          case "createPlan":
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            break;
          case "createTask":
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            break;
          case "controlTimer":
            if (action.data?.action === "start" && window.location.pathname !== "/dashboard/timers") {
              navigate("/dashboard/timers");
            }
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("trackergoal-timer-control", { detail: action.data }));
            }, 150);
            break;
          case "listGoals":
            break;
        }
      }
    },
    [queryClient, navigate]
  );

  // ─── Send text message ───
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !user) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const history = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            userId: user.id,
            history,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Server error" }));
          throw new Error(err.error || "Failed to get response");
        }

        const data = await res.json();

        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          actions: data.actions,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        handleActions(data.actions);
      } catch (error: any) {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Sorry, something went wrong: ${error.message}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [user, messages, handleActions]
  );

  // ─── Send file upload ───
  const sendFile = useCallback(
    async (file: File, message?: string) => {
      if (!user) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message || `📎 Uploaded: ${file.name}`,
        fileName: file.name,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.id);
        formData.append("message", message || `Analyze this file "${file.name}" and create a 10-day study plan from its content.`);

        const res = await fetch(`${API_URL}/api/chat/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Server error" }));
          throw new Error(err.error || "Failed to process file");
        }

        const data = await res.json();

        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          actions: data.actions,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        handleActions(data.actions);
      } catch (error: any) {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I couldn't process that file: ${error.message}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [user, handleActions]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chat cleared! 🧹 What would you like to work on?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return { messages, isLoading, sendMessage, sendFile, clearChat };
}
