/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
const ChatWindow: React.FC<any> = ({ username }) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting");
  const [usersOnline, setUsersOnline] = useState(0);
  const [matchedWith, setMatchedWith] = useState<string>("");
  useEffect(() => {
    const newSocket: any = io("https://chattingapp-2-o3ry.onrender.com/");
    setSocket(newSocket);
    newSocket.emit("register-user", username);

    newSocket.on("online-users", (users: string[]) => {
      setUsersOnline(users.length);
    });

    newSocket.on("waiting", (message: string) => {
      setStatus("waiting");
    });

    newSocket.on("matched-user", (message: string) => {
      setMatchedWith(message);
    });

    newSocket.on("chat-started", (partner: any) => {
      setPartnerId(partner.userId);
      setStatus("started");
    });

    newSocket.on("partner-disconnected", (message: any) => {
      setStatus("disconnected");
      // After a disconnection, automatically attempt to find a new match\
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
        <div className="text-lg font-semibold text-primaryTheme mb-4">
          Matched with: <span className="font-bold">{matchedWith}</span>
        </div>
      )}
      {status === "disconnected" ? (
        <>
          <div>
            {matchedWith} has disconnected. We are constantly trying to match
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
                <strong className="text-primaryTheme">{msg.user}:</strong>{" "}
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
          Find New Partner
        </button>
      )}
      <div className="text-center text-sm text-gray-500 mt-4">
        Users Online:{" "}
        <span className="font-bold text-primaryTheme">{usersOnline + 100}</span>
      </div>
    </div>
  );
};

export default ChatWindow;
