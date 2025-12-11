/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* ChatWindow.tsx */
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// small unique id generator for client messages
const genClientId = () => `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

type MessageItem = {
  clientMessageId?: string | null; // client-side temporary id
  id?: string | null; // server message id
  user: string;
  text?: string;
  isOwnMessage?: boolean;
  timestamp?: string | Date;
  status?: "sending" | "saved" | "failed" | "delivered";
  sessionId?: string | null;
  type?: "text" | "image";
  imageDataUrl?: string | null; // for optimistic local image or for received image
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

const ChatWindow: React.FC<{ username: string }> = ({ username }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "waiting" | "started" | "disconnected">("connecting");
  const [myId, setMyId] = useState<string | null>(null);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const LOCAL = "http://localhost:3000";
    const ORIGIN = (window.location && window.location.origin) || LOCAL;
    const SOCKET_URL = LOCAL || ORIGIN;

    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    setSocket(s);
    socketRef.current = s;

    s.on("connect", () => {
      console.log("connected", s.id);
      s.emit("register-user", username);
      setStatus("waiting");
    });

    s.on("register-success", (payload: any) => {
      setMyId(payload.userId);
    });

    s.on("waiting", () => {
      setStatus("waiting");
      setSessionId(null);
    });

    s.on("chat-started", (payload: any) => {
      setSessionId(payload.sessionId || null);
      setStatus("started");
      setMessages([]);
    });

    s.on("partner-typing", () => {
      setPartnerIsTyping(true);
    });
    s.on("partner-stopped-typing", () => {
      setPartnerIsTyping(false);
    });

    // receive-message: { messageId, from, to, content, type, timestamp, sessionId, clientMessageId? }
    s.on("receive-message", (payload: any) => {
      try {
        const isOwn = String(payload.from) === String(myId);
        // if server included clientMessageId, try to merge with optimistic message
        if (payload.clientMessageId) {
          setMessages((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((m) => m.clientMessageId === payload.clientMessageId);
            if (idx !== -1) {
              // update the optimistic message into saved message
              copy[idx] = {
                ...copy[idx],
                id: payload.messageId ?? copy[idx].id,
                status: "saved",
                timestamp: payload.timestamp ?? copy[idx].timestamp,
                type: payload.type || copy[idx].type,
                imageDataUrl: payload.type === "image" ? payload.content : copy[idx].imageDataUrl,
                text: payload.type === "text" ? payload.content : copy[idx].text,
              };
              return copy;
            } else {
              // no optimistic message found, push a new message
              const msg: MessageItem = {
                id: payload.messageId ?? null,
                user: isOwn ? username || "Me" : "Partner",
                text: payload.type === "text" ? payload.content : undefined,
                isOwnMessage: isOwn,
                timestamp: payload.timestamp ?? new Date().toISOString(),
                status: "saved",
                sessionId: payload.sessionId,
                type: payload.type || "text",
                imageDataUrl: payload.type === "image" ? payload.content : null,
              };
              return [...copy, msg];
            }
          });
        } else {
          // no clientMessageId: simply add message if it's not duplicate
          setMessages((prev) => {
            // avoid exact duplicates by messageId if exists
            if (payload.messageId && prev.some((m) => m.id === payload.messageId)) return prev;
            const msg: MessageItem = {
              id: payload.messageId ?? null,
              user: isOwn ? username || "Me" : "Partner",
              text: payload.type === "text" ? payload.content : undefined,
              isOwnMessage: isOwn,
              timestamp: payload.timestamp ?? new Date().toISOString(),
              status: "saved",
              sessionId: payload.sessionId,
              type: payload.type || "text",
              imageDataUrl: payload.type === "image" ? payload.content : null,
            };
            return [...prev, msg];
          });
        }
      } catch (err) {
        console.error("receive-message handling error", err);
      }
    });

    // message-saved: { messageId, timestamp, clientMessageId? }
    s.on("message-saved", (ack: any) => {
      setMessages((prev) => {
        const copy = [...prev];
        // try to match by clientMessageId if provided
        if (ack?.clientMessageId) {
          const idx = copy.findIndex((m) => m.clientMessageId === ack.clientMessageId);
          if (idx !== -1) {
            copy[idx] = {
              ...copy[idx],
              id: ack.messageId ?? copy[idx].id,
              status: "saved",
              timestamp: ack.timestamp ?? copy[idx].timestamp,
            };
            return copy;
          }
        }
        // fallback: find last sending message and mark saved
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].isOwnMessage && copy[i].status === "sending") {
            copy[i] = { ...copy[i], id: ack.messageId ?? copy[i].id, status: "saved", timestamp: ack.timestamp ?? copy[i].timestamp };
            break;
          }
        }
        return copy;
      });
    });

    s.on("send-failed", (err: any) => {
      console.warn("send-failed", err);
      setMessages((prev) => {
        const copy = [...prev];
        // mark the matching clientMessageId as failed if present
        if (err?.clientMessageId) {
          const idx = copy.findIndex((m) => m.clientMessageId === err.clientMessageId);
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], status: "failed" };
            return copy;
          }
        }
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].isOwnMessage && copy[i].status === "sending") {
            copy[i] = { ...copy[i], status: "failed" };
            break;
          }
        }
        return copy;
      });
    });

    s.on("partner-disconnected", () => {
      setStatus("disconnected");
    });

    return () => {
      try {
        s.off("connect");
        s.off("register-success");
        s.off("waiting");
        s.off("chat-started");
        s.off("partner-typing");
        s.off("partner-stopped-typing");
        s.off("receive-message");
        s.off("message-saved");
        s.off("send-failed");
        s.off("partner-disconnected");
        s.disconnect();
      } catch (err) {
        // ignore cleanup errors
      }
      socketRef.current = null;
    };
  }, [username, myId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const sanitize = (s = "") => String(s).trim().slice(0, 2000);

  const sendTextMessage = () => {
    if (!socketRef.current || !sessionId) return;
    const text = sanitize(inputMessage);
    if (!text) return;

    const clientMessageId = genClientId();

    const localMsg: MessageItem = {
      clientMessageId,
      id: null,
      user: username || "Me",
      text,
      isOwnMessage: true,
      timestamp: new Date().toISOString(),
      status: "sending",
      sessionId,
      type: "text",
    };
    setMessages((prev) => [...prev, localMsg]);

    socketRef.current.emit("send-message", {
      sessionId,
      content: text,
      type: "text",
      clientMessageId,
    });

    setInputMessage("");
    socketRef.current.emit("user-stopped-typing", { sessionId });
  };

  const handleTyping = () => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit("user-typing", { sessionId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("user-stopped-typing", { sessionId });
    }, 1500);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only PNG or JPG images are allowed");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      alert("Image too large. Max 2 MB allowed");
      return;
    }

    const clientMessageId = genClientId();

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // optimistic local image message
      const localMsg: MessageItem = {
        clientMessageId,
        id: null,
        user: username || "Me",
        isOwnMessage: true,
        timestamp: new Date().toISOString(),
        status: "sending",
        sessionId,
        type: "image",
        imageDataUrl: dataUrl,
      };
      setMessages((prev) => [...prev, localMsg]);

      // emit to server with clientMessageId so we can match later
      socketRef.current?.emit("send-message", {
        sessionId,
        content: dataUrl,
        type: "image",
        clientMessageId,
      });
    };
    reader.readAsDataURL(file);

    // reset input so same file can be selected again if needed
    e.currentTarget.value = "";
  };

  const renderMessage = (m: MessageItem, idx: number) => {
    const own = !!m.isOwnMessage;
    return (
      <div key={m.clientMessageId ?? m.id ?? idx} className={`flex mb-2 ${own ? "justify-end" : "justify-start"}`}>
        <div className={`rounded p-2 max-w-[70%] ${own ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}>
          {!own && <div className="font-bold mb-1">Partner</div>}
          {m.type === "image" && m.imageDataUrl ? (
            <img src={m.imageDataUrl} alt="shared" style={{ maxWidth: "300px", borderRadius: 8 }} />
          ) : (
            <div>{m.text}</div>
          )}
          <div style={{ fontSize: 11, marginTop: 6, color: own ? "#e6f0ff" : "#666" }}>
            {new Date(m.timestamp || Date.now()).toLocaleTimeString()}
            {m.isOwnMessage && m.status === "sending" && <span style={{ marginLeft: 8 }}>Sending…</span>}
            {m.isOwnMessage && m.status === "saved" && <span style={{ marginLeft: 8 }}>Saved</span>}
            {m.isOwnMessage && m.status === "failed" && <span style={{ marginLeft: 8, color: "red" }}>Failed</span>}
          </div>
        </div>
      </div>
    );
  };

  const handleEndSession = () => {
    if (!socketRef.current || !sessionId) return;
    socketRef.current.emit("end-session", { sessionId });
    setSessionId(null);
    setStatus("waiting");
    setMessages([]);
  };

  const handleManualDisconnect = () => {
    if (!socketRef.current) return;
    if (sessionId) {
      socketRef.current.emit("end-session", { sessionId });
    }
    socketRef.current.emit("manual-disconnect", {});
    setStatus("waiting");
    setSessionId(null);
    setMessages([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Logged in as:</strong> {username}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, border: "1px solid #ddd", borderRadius: 8 }}>
        {messages.map((m, i) => renderMessage(m, i))}
        <div ref={messagesEndRef} />
      </div>

      {partnerIsTyping && <div style={{ fontStyle: "italic", marginTop: 6 }}>Partner is typing…</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendTextMessage();
            }
          }}
          placeholder="Type a message"
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          disabled={status !== "started"}
        />

        <label style={{ display: "inline-block", padding: "8px 10px", borderRadius: 8, background: "#eee", cursor: "pointer" }}>
          📷
          <input type="file" accept="image/png, image/jpeg" onChange={handleImageSelect} style={{ display: "none" }} />
        </label>

        <button onClick={sendTextMessage} disabled={!inputMessage.trim() || status !== "started"} style={{ padding: "8px 12px", borderRadius: 8, background: "#2b6cb0", color: "white", border: "none" }}>
          Send
        </button>

        <button onClick={handleEndSession} style={{ padding: "8px 12px", borderRadius: 8, background: "#e53e3e", color: "white", border: "none" }}>
          End
        </button>

        <button onClick={handleManualDisconnect} style={{ padding: "8px 12px", borderRadius: 8 }}>
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
