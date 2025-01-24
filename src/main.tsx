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

function ChatWindow({username}:any) {
  console.log("recieved is : username",username)
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting");
  const [usersOnline, setUsersOnline] = useState(0);
  const [matchedWith, setMatchedWith] = useState<string>("");

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
      // setMatchedWith(message);
      console.log("Matche duser is L: ", message);
    });

    newSocket.on("chat-started", (partner: any) => {
      console.log("partnechatr", partner?.username);
      setMatchedWith(partner?.username);
      setPartnerId(partner.userId);
      setStatus("started");
    });

    newSocket.on("partner-disconnected", (message: any) => {
      console.log("partner-disconnected", message);
      setStatus("disconnected");
      // After a disconnection, automatically attempt to find a new match
      setMatchedWith(""); // Reset matched partner info
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
      setMessages((prev) => [...prev, { user: "Me", text: inputMessage }]);
      setInputMessage("");
    }
  };

  const handleDisconnect = () => {
    if (socket) {
      alert("Disconnecting...");
      socket.emit("disconnected"); // Disconnect from partner
      setStatus("waiting"); // Reset status to waiting
      setMatchedWith(""); // Clear matched partner info
      setMessages([]); // Clear messages
      setPartnerId(null); // Reset partner ID
    }
  };

  const handleReconnect = () => {
    if (socket) {
      setStatus("waiting");
      socket.emit("register-user", username); // Re-register to find a new partner
    }
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
        <div className="text-lg font-semibold text-blue-600 mb-4">
          Chatting With : <span className="font-bold">{matchedWith}</span>
        </div>
      )}
      {status === "disconnected" ? (
        <>
          <div>
            {matchedWith}Partner has disconnected. We are constantly trying to match
            you up with someone else.
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
          <div className="messages bg-gray-100 rounded-lg p-4 mb-4 h-60 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className="message mb-2">
                <strong className="text-blue-600">{msg.user}:</strong>{" "}
                <span className="text-gray-700">{msg.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {status === "started" && (
        <div className="input-container flex items-center gap-2 mb-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all ${
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
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all"
        >
          Disconnect from partner
        </button>
      )}
      {status === "waiting" && (
        <button
          onClick={handleReconnect}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all"
        >
          Find New Partner
        </button>
      )}
      <div className="text-center text-sm text-gray-500 mt-4">
        Users Online:{" "}
        <span className="font-bold text-blue-600">{usersOnline + 100}</span>
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
          <div className="text-xl font-semibold text-blue-600 text-center mb-4">
            Welcome to ChatApp
          </div>
          <div>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button
              onClick={handleRegister}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-all"
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
    <div className="h-screen w-screen">
      <div>
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
          <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-6">
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
              Chat App
            </h1>
            <UserRegistration />
          </div>
        </div>
      </div>
    </div>
  </StrictMode>
);
