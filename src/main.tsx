/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  default as React,
  StrictMode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import "./App.css";
import { Images } from "./Utils/Images";

function ChatWindow({ username }: any) {
  console.log("recieved is : username", username);
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting");
  const [usersOnline, setUsersOnline] = useState(0);
  const [matchedWith, setMatchedWith]: any = useState<any>(null);

  useEffect(() => {
    const audio = new Audio("https://www.soundjay.com/button/beep-07.wav"); // 1-second beep sound
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });

    // Optional cleanup
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const newSocket: any = io("http://localhost:3999/");
    setSocket(newSocket);
    newSocket.emit("register-user", username);

    newSocket.on("online-users", (users: string[]) => {
      setUsersOnline(users.length);
    });

    newSocket.on("waiting", (message: string) => {
      console.log("message", message);
      setStatus("waiting");
    });

    newSocket.on("matched-user", (message: string) => {
      console.log("Matche duser is L: ", message);
    });

    newSocket.on("chat-started", (partner: any) => {
      console.log("partnechatr", partner);
      setMatchedWith(partner);
      setPartnerId(partner.userId);
      setStatus("started");
    });

    newSocket.on("partner-disconnected", (message: any) => {
      console.log("partner-disconnected", message);
      setStatus("disconnected");
      // After a disconnection, automatically attempt to find a new match
      setMatchedWith(null); // Reset matched partner info
      setMessages([]); // Clear message history
      setPartnerId(null); // Reset partner ID
    });

    newSocket.on(
      "receive-message",
      ({ message, from }: { message: string; from: string }) => {
        setMessages((prev) => [
          ...prev,
          { user: `Partner (${from})`, text: message },
        ]);
      }
    );

    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  const handleSendMessage = () => {
    if (socket && partnerId) {
      socket.emit("send-message", { message: inputMessage, to: partnerId });
      setMessages((prev) => [
        ...prev,
        { user: "Me", text: inputMessage, isOwnMessage: true },
      ]);
      setInputMessage("");
    }
  };

  const handleDisconnect = () => {
    if (socket) {
      alert("Disconnecting...");
      // Notify the server of manual disconnect
      socket.emit("manual-disconnect", { partnerId });

      // Update the local state
      setStatus("waiting"); // Reset status to waiting
      setMatchedWith(""); // Clear matched partner info
      setMessages([]); // Clear messages
      setPartnerId(null); // Reset partner ID

      // Optionally disconnect the socket completely
      socket.disconnect();
    }
  };

  const handleReconnect = () => {
    if (socket) {
      setStatus("waiting");
      socket.emit("register-user", username); // Re-register to find a new partner
    }
  };

  const handleTyping = () => {
    socket.emit("user-typing", {
      username, // Your username
      to: partnerId, // Recipient's ID
    });
  };

  return (
    <div className="bg-white flex justify-between flex-col rounded-lg w-full ">
      {status === "connecting" && (
        <div className="text-center text-gray-500">Connecting...</div>
      )}
      {status === "waiting" && (
        <div className="text-center text-gray-500">
          Please wait! We are looking for a match...
        </div>
      )}
      {matchedWith && status !== "waiting" && (
        <div className="text-lg font-semibold text-primaryTheme mb-4">
          You’ve matched with:{" "}
          <span className="font-bold">{matchedWith?.username}</span> –{" "}
          <span className="italic">
            Your conversation just got a whole lot more interesting!
          </span>
        </div>
      )}
      {status === "disconnected" ? (
        <>
          <div>
            {matchedWith?.userName}Partner has disconnected. We are constantly
            trying to match you up with someone else.
          </div>
          <button
            onClick={handleReconnect}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all mt-4"
          >
            Find New Partner
          </button>
        </>
      ) : (
        <>
          {" "}
          {status === "waiting" ? (
            <>
              <div className="messages bg-gray-100  rounded-lg p-4 mb-4 h-60 overflow-y-hidden">
                <img src={Images?.LookingForPartner} alt="Partner Vector" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col h-60 overflow-y-auto">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 flex items-center ${
                      msg.isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-md px-2 py-1 text-sm ${
                        msg.isOwnMessage
                          ? "bg-primaryTheme text-white ml-2"
                          : "bg-gray-200 text-gray-800 mr-2"
                      }`}
                    >
                      <strong>{msg.user}:</strong> <span>{msg.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {status === "started" && (
        <div className="input-container flex items-center gap-2 mb-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className={`bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all ${
              !inputMessage.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Send
          </button>
        </div>
      )}
      {status === "started" && (
        <button
          onClick={handleDisconnect}
          className="bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all"
        >
          Disconnect from partner
        </button>
      )}
      {status === "waiting" && (
        <button
          onClick={handleReconnect}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all"
        >
          "Oh no! Still no partner? Don’t worry, you’re not{" "}
          <span className="italic">that</span> unpopular. Feel free to{" "}
          <span className="font-bold">refresh</span>. Maybe the universe will be
          kinder next time!"
        </button>
      )}
      <div className="text-center text-sm text-gray-500 mt-4">
        Users Online:{" "}
        <span className="font-bold text-primaryTheme">
          {usersOnline + 1232}
        </span>
      </div>
    </div>
  );
}

function UserRegistration() {
  const [username, setUsername] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRegister = () => {
    if (username.trim()) {
      setIsRegistered(true);
      setError("");
    } else {
      setError("Username cannot be empty");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-lg h-full w-full ">
      {!isRegistered ? (
        <div className="w-full h-full p-4 flex flex-col justify-between">
          <div className="text-xl font-semibold text-primaryTheme text-center mb-4">
            Welcome to ChatApp
          </div>
          <div>
            <input
              ref={inputRef}
              type="text"
              autoComplete="on"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button
              onClick={handleRegister}
              className="w-full bg-primaryTheme text-white font-medium py-2 rounded-lg hover:bg-onHoveringPrimaryTheme transition-all"
            >
              Register
            </button>
          </div>
        </div>
      ) : (
        <ChatWindow username={username} />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="h-screen overflow-hidden w-screen">
      <div>
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
          <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-6">
            <h1 className="text-2xl font-bold text-center text-primaryTheme mb-6">
              Blind
            </h1>
            <UserRegistration />
          </div>
        </div>
      </div>
    </div>
  </StrictMode>
);
