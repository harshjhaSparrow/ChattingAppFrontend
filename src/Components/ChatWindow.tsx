/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { capitalizeFirstLetters } from "~/Utils/Commonfunctions";
import heart from "../public/Beatinghearts.gif";
import LookingForPartner from "../public/LookingForPartner.gif";
import CoffeeDonut from "../public/coffeedonutgif.gif";

export const ChatWindow = ({ username }: any) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting");
  const [usersOnline, setUsersOnline] = useState(0);
  const [matchedWith, setMatchedWith]: any = useState<any>(null);
  const [myDetails, setMyDetails] = useState<any>(null);

  useEffect(() => {
    //const newSocket: any = io("https://chattingapp-2-o3ry.onrender.com/");
    const newSocket: any = io("http://localhost:3999/");
    setSocket(newSocket);
    newSocket.emit("register-user", username);

    newSocket.on("online-users", (users: string[]) => {
      setUsersOnline(users.length);
    });

    newSocket.on("my-detail", (user: any) => {
      setMyDetails(user);
    });

    newSocket.on("waiting", (message: string) => {
      setStatus("waiting");
    });

    newSocket.on("matched-user", (message: string) => {});

    newSocket.on("chat-started", (partner: any) => {
      setMatchedWith(partner);

      setPartnerId(partner.userId);
      setStatus("started");
    });

    newSocket.on("partner-disconnected", (message: any) => {
      setStatus("disconnected");
      // After a disconnection, automatically attempt to find a new match
      setMatchedWith(null); // Reset matched partner info
      setMessages([]); // Clear message history
      setPartnerId(null); // Reset partner ID
    });

    newSocket.on(
      "receive-message",
      ({ message, from }: { message: any; from: string }) => {
        setMessages((prev) => [
          ...prev,
          {
            user: `(${from})`,
            text: message?.text,
            otherMessageDetails: message,
          },
        ]);
      }
    );

    // Cleanup function to remove listeners
    return () => {
      newSocket.off("online-users");
      newSocket.off("my-detail");
      newSocket.off("waiting");
      newSocket.off("matched-user");
      newSocket.off("chat-started");
      newSocket.off("partner-disconnected");
      newSocket.off("receive-message");
      newSocket.disconnect();
    };
  }, [username]);

  // State to hold the media files
  const [attachments, setAttachments] = useState([]);
  const handleSendMessage = () => {
    if (socket && partnerId && myDetails) {
      // Build the message object using myDetails
      const message = {
        text: inputMessage, // The text content from the input
        senderId: myDetails._id, // Use myDetails._id as the senderId
        receiverId: partnerId, // The ID of the matched partner
        timestamp: new Date().toISOString(), // Current timestamp when the message is sent
        messageType: "text", // Assuming it’s a text message for now, can be dynamic
        status: "sent", // Initially, set as "sent"
        isOwnMessage: true, // This is the logged-in user’s message
        attachments: attachments, // Include attachments (media files)
        isTyping: false, // Set to false initially (can be used to show typing indicator)
      };

      // Emit the message via socket
      socket.emit("send-message", { message: message, to: partnerId });

      // Update the messages state to reflect the sent message
      setMessages((prev) => [
        ...prev,
        {
          user: myDetails.username, // Use myDetails.username for the sender
          text: inputMessage,
          isOwnMessage: true,
          timestamp: message.timestamp, // Add timestamp to the message display
          otherMessageDetails: message, // Store the message object for reference
        },
      ]);

      // Clear the input field after sending
      setInputMessage("");
      setAttachments([]); // Clear attachments after sending the message
    }
  };

  // Handle file selection
  const handleFileChange = (event: any) => {
    const files = event.target.files;
    if (files.length > 0) {
      const fileArray: any = Array.from(files);
      setAttachments(fileArray); // Save the selected files in the state
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

  function arrayBufferToBase64(arrayBuffer: any) {
    // Convert ArrayBuffer to a Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create a binary string from the uint8Array
    let binaryString = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }

    // Convert binary string to Base64
    const base64String = btoa(binaryString);

    // Return the Base64 string as a data URL for use in an <img> tag
    return `data:image/png;base64,${base64String}`;
  }

  return (
    <div className="bg-white flex justify-between flex-col h-full rounded-lg w-full ">
      {status === "waiting" && (
        <div className="text-center text-gray-500">
          Please wait! We are looking for a match...
        </div>
      )}
      {matchedWith && status !== "waiting" && (
        <div className="text-lg text-center font-semibold text-primaryTheme mb-4">
          <div className="font-bold text-center flex justify-center items-center space-x-2">
            <div className="flex items-center">
              <div>
                You’ve matched with:{" "}
                {capitalizeFirstLetters(matchedWith?.username)}
              </div>
              <div className="ml-2">
                <div className="h-2 w-2 rounded-full bg-green-500 inline-block"></div>
              </div>
            </div>
          </div>
          –{" "}
          <span className="italic">
            Your conversation just got a whole lot more interesting!
          </span>
        </div>
      )}
      {status === "disconnected" ? (
        <>
          <div className="text-center">
            {matchedWith?.userName}Partner has disconnected. We are constantly
            trying to match you up with someone else.
          </div>

          <div className="flex items-center h-full w-full justify-center mt-4">
            <div>
              <img src={heart} className="w-[200px] h-[200px]" alt="" />
            </div>
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
                <>
                  <div className="text-center flex flex-col justify-center items-center w-full h-full text-gray-500">
                    <div>
                      <img
                        src={CoffeeDonut}
                        className="w-[150px] rounded-full h-[150px]"
                        alt="Coffee and Donut"
                      />
                    </div>
                    <p className="mt-4 text-lg font-medium">
                      Hi {myDetails?.username}! Waiting to match with a new
                      partner...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col h-full overflow-y-auto">
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
                                : "bg-gray-200 w-auto text-gray-800 mr-2"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              {/* User Name */}
                              <span className="font-bold">
                                {!msg.isOwnMessage &&
                                  msg.user.replace(/[()]/g, "")}
                              </span>
                            </div>

                            {/* Message Text */}
                            <div className="mt-1">
                              <span>{msg.text}</span>
                            </div>

                            {msg?.otherMessageDetails?.attachments?.[0] && (
                              <div>
                                {msg.isOwnMessage ? (
                                  <>Sent an Image</>
                                ) : (
                                  <img
                                    src={arrayBufferToBase64(
                                      msg?.otherMessageDetails?.attachments?.[0]
                                    )}
                                    alt="Message Attachment"
                                    className="max-w-[80%] h-auto rounded-md"
                                  />
                                )}
                              </div>
                            )}

                            {/* Message Timestamp */}
                            <div
                              className={`text-xs mt-1 ${
                                !msg.isOwnMessage ? "text-black" : "text-white"
                              }`}
                            >
                              {new Date(
                                msg.otherMessageDetails.timestamp
                              ).toLocaleTimeString()}
                            </div>

                            {/* Optional: Display Typing Indicator */}
                            {msg.otherMessageDetails?.isTyping && (
                              <div className="text-xs text-gray-500 mt-1">
                                User is typing...
                              </div>
                            )}
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
        <div className="input-container flex items-center gap-2 md:mb-4 mb-0">
          {/* Text input */}
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

          {/* File upload button */}
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="material-icons active:mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="gray"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-paperclip"
              >
                <path d="M13.234 20.252 21 12.3" />
                <path d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486" />
              </svg>
            </span>{" "}
            {/* You can use any icon here */}
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden active:mt-1" // Hide the default file input
          />

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() && attachments.length === 0}
            className={`bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all ${
              !inputMessage.trim() && attachments.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Send
          </button>
        </div>
      )}
      {status === "started" && (
        <div className="flex md:justify-center justify-end my-2 items-center">
          <div>
            <button
              onClick={handleDisconnect}
              className="bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all"
            >
              End & Find Another
            </button>
          </div>
        </div>
      )}
      {status === "waiting" && (
        <div className="flex items-center justify-center">
          <div className="bg-green-600 text-white w-full text-center px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all">
            <span className="italic"></span>Feel free to{" "}
            <span className="font-bold">refresh</span>. Maybe the universe will
            be kinder next time!"
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
