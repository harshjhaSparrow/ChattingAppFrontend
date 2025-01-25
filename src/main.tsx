/* eslint-disable @typescript-eslint/no-unused-vars */
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
// import { capitalizeFirstLetters } from "./Utils/Commonfunctions";
import LookingForPartner from "../public/LookingForPartner.gif";
import CoffeeDonut from "../public/coffeedonutgif.gif";

function capitalizeFirstLetters(str: string) {
  // Convert string to array of characters
  const chars: any = str.split("");

  // Capitalize the first letter of each word
  for (let i = 0; i < chars.length; i++) {
    if (i === 0 || chars[i - 1] === " ") {
      chars[i] = chars[i].toUpperCase();
    } else {
      chars[i] = chars[i].toLowerCase();
    }
  }

  // Join the characters back into a string
  return chars.join("");
}

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
    const newSocket: any = io("https://chattingapp-42yp.onrender.com/");
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
    <div className="bg-white flex justify-between flex-col h-full rounded-lg w-full ">
      {status === "connecting" && (
        <div className="text-center flex justify-center items-center w-full h-full text-gray-500">
          <div>
            <img src={CoffeeDonut} className="w-[150px] h-[100px]" alt="" />
          </div>
        </div>
      )}
      {status === "waiting" && (
        <div className="text-center text-gray-500">
          Please wait! We are looking for a match...
        </div>
      )}
      {matchedWith && status !== "waiting" && (
        <div className="text-lg text-center font-semibold text-primaryTheme mb-4">
          You’ve matched with:{" "}
          <span className="font-bold">
            {capitalizeFirstLetters(matchedWith?.username)}
          </span>{" "}
          –{" "}
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
              <div className="messages rounded-full flex justify-center items-center  p-4 mb-4 h-fit overflow-y-hidden">
                <img
                  src={LookingForPartner}
                  className="h-[200px] rounded-full w-[00px]"
                  alt="Partner Vector"
                />
              </div>
            </>
          ) : (
            <>
              {status === "connecting" ? (
                <>Conecting</>
              ) : (
                <>
                  <div className="flex flex-col h-60 overflow-y-auto">
                    <div>
                      {messages?.map((msg, index) => (
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
                            {/* <strong>{msg.user}:</strong>  */}
                            <span>{msg.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
        <div className="flex items-center justify-center">
          <div>
            <button
              onClick={handleDisconnect}
              className="bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all"
            >
              Disconnect from partner
            </button>
          </div>
        </div>
      )}
      {status === "waiting" && (
        <div className="flex items-center justify-center">
          <div className="bg-green-600 text-white w-full text-center px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all">
            <span className="italic">that</span> unpopular. Feel free to{" "}
            <span className="font-bold">refresh</span>. Maybe the universe will
            be kinder next time!"
          </div>
        </div>
      )}
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
    <div className="flex flex-col items-center p-4 justify-center bg-white h-full w-full ">
      <div className="text-2xl pl-8 py-4 left font-bold w-full text-center text-primaryTheme">
        <div>Blind</div>
        <div></div>
      </div>
      {!isRegistered ? (
        <div className="w-full h-full py-6 px-4 flex flex-col justify-between">
          <div className="text-xl font-semibold text-primaryTheme text-center mb-4">
            Welcome to ChatApp
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Chat Guidelines
            </h2>
            <ul className="space-y-3 text-gray-700 text-base">
              <li className="flex items-start">
                <span className="mr-2 text-blue-500 font-semibold">•</span> Be
                respectful and kind to others.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500 font-semibold">•</span> Do
                not share personal information or photos.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500 font-semibold">•</span> No
                harassment or hate speech allowed.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500 font-semibold">•</span> Keep
                conversations family-friendly.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500 font-semibold">•</span> If
                you feel uncomfortable, leave the chat immediately.
              </li>
            </ul>
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
          <div className="bg-white shadow-lg rounded-lg w-full h-screen ">
            <UserRegistration />
          </div>
        </div>
      </div>
    </div>
  </StrictMode>
);
