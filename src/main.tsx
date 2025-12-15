/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, ChakraProvider } from "@chakra-ui/react";
import {
  default as React,
  StrictMode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import Linkify from "react-linkify";
import { io } from "socket.io-client";
import CoffeeDonut from "../public/coffeedonutgif.png";
import Logo from "../public/Logo.png";
import "./App.css";
import ImagePreviewModal from "./Components/ImagePreviewModal";
import SidebarDrawer from "./Components/SidebarDrawer";
import {
  arrayBufferToBase64,
  capitalizeFirstLetters,
} from "./Utils/Commonfunctions";

function ChatWindow({ username }: any) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting");
  const [usersOnline, setUsersOnline] = useState(0);
  const [matchedWith, setMatchedWith]: any = useState<any>(null);
  const [myDetails, setMyDetails] = useState<any>(null);
  const [partnerIsTyping, setpartnerIsTyping] = useState<boolean>(false);
  const [iamTyping, setIamTyping] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<any[]>([]); // can be File[] or already-encoded attachments
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewURLs, setPreviewURLs] = useState<string[]>([]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerIsTyping]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "chattingApp"); // ✅ from your preset
    formData.append("folder", "chattingApp/media");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/drgklvsmv/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url; // ✅ CDN URL
  };

  useEffect(() => {
    //const newSocket: any = io("http://localhost:3999");
    const newSocket: any = io("https://chattingapp-2-o3ry.onrender.com/");
    setSocket(newSocket);
    newSocket.emit("register-user", username);
    newSocket.on("online-users", (users: string[]) => {
      setUsersOnline(users?.length);
    });
    newSocket.on("my-detail", (user: any) => {
      setMyDetails(user);
    });
    newSocket.on("waiting", (message: string) => {
      setStatus("waiting");
    });
    // Listen for typing events from the server
    newSocket.on("user-typing", (message: any) => {
      setpartnerIsTyping(true);
    });
    newSocket.on("user-stopped-typing", (message: any) => {
      setpartnerIsTyping(false);
    });
    newSocket.on("matched-user", (message: string) => {});
    newSocket.on("chat-started", (partner: any) => {
      setMatchedWith(partner);
      setPartnerId(partner?.userId);
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

    return () => {
      try {
        newSocket.off("online-users");
        newSocket.off("my-detail");
        newSocket.off("waiting");
        newSocket.off("matched-user");
        newSocket.off("chat-started");
        newSocket.off("partner-disconnected");
        newSocket.off("receive-message");
        newSocket.off("user-typing");
        newSocket.off("user-stopped-typing");
        newSocket.disconnect();
      } catch (err) {
        // ignore
      }
    };
  }, [username]);

  // Helper: convert File -> dataURL (base64)
  const convertToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  // When user selects files from input -> open preview modal with object URLs
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const MAX_FILE_SIZE_MB = 2;
    const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Type check
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        errors.push(`${file.name} is not a supported image type.`);
        return;
      }

      // Size check
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          `${file.name} is too large. Max allowed size is ${MAX_FILE_SIZE_MB}MB.`
        );
        return;
      }

      validFiles.push(file);
    });

    // Show all errors together (better UX)
    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length === 0) {
      event.target.value = ""; // ✅ reset input
      return;
    }

    // Create object URLs for preview
    const urls = validFiles.map((file) => URL.createObjectURL(file));

    setPreviewFiles(validFiles);
    setPreviewURLs(urls);
    setPreviewModalOpen(true);

    // ✅ reset input so same file can be re-selected
    event.target.value = "";
  };

  // Send images selected in preview modal
  const handleSendFromPreview = async (caption?: string) => {
    if (!socket || !partnerId || !myDetails) return;

    try {
      const uploadedUrls: string[] = [];

      for (const file of previewFiles) {
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
      }

      const finalText = !caption || caption.trim() === "" ? "Media" : caption;

      const message = {
        text: finalText,
        senderId: myDetails._id,
        receiverId: partnerId,
        timestamp: new Date().toISOString(),
        messageType: "image",
        status: "sent",
        isOwnMessage: true,
        attachments: uploadedUrls.map((url) => ({
          type: "image",
          url,
        })),
      };

      setMessages((prev) => [
        ...prev,
        {
          user: myDetails.username,
          text: finalText,
          isOwnMessage: true,
          timestamp: message.timestamp,
          otherMessageDetails: message,
        },
      ]);

      socket.emit("send-message", { message, to: partnerId });
    } catch (err) {
      alert("Image upload failed. Please try again.");
    } finally {
      previewURLs.forEach(URL.revokeObjectURL);
      setPreviewFiles([]);
      setPreviewURLs([]);
      setPreviewModalOpen(false);
      setInputMessage("");
    }
  };

  // Minimal change to original handleSendMessage (text send and attachments array)
  const handleSendMessage = () => {
    if (socket && partnerId && myDetails) {
      // If text is empty and attachments exist → set "Media"
      const finalText =
        (!inputMessage || inputMessage.trim() === "") && attachments?.length > 0
          ? "Media"
          : inputMessage;

      // Build the message object
      const message = {
        text: finalText, // Updated text logic
        senderId: myDetails?._id,
        receiverId: partnerId,
        timestamp: new Date().toISOString(),
        messageType: attachments?.length > 0 ? "image" : "text",
        status: "sent",
        isOwnMessage: true,
        attachments: attachments, // File array or pre-encoded array
        isTyping: false,
      };

      console.log(":messagemessagemessage", message);

      // Emit the message through socket
      socket.emit("send-message", { message: message, to: partnerId });

      // Update chat UI immediately
      setMessages((prev) => [
        ...prev,
        {
          user: myDetails?.username,
          text: finalText, // Updated here too
          isOwnMessage: true,
          timestamp: message.timestamp,
          otherMessageDetails: message,
        },
      ]);

      // Reset values
      setInputMessage("");
      setAttachments([]);
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

  // This function is called when the user is typing
  const handleTyping = () => {
    setIamTyping(true); // You are typing
    socket.emit("user-typing", { username, to: partnerId });

    // Clear any previous timeout to reset the delay
    if (typingTimeoutRef?.current) {
      clearTimeout(typingTimeoutRef?.current);
    }

    // Set a timeout to detect when user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      setIamTyping(false); // You stopped typing

      socket.emit("user-stopped-typing", { username, to: partnerId });
    }, 2000); // User stops typing after 2 seconds of inactivity
  };

  return (
    <div className="bg-white flex justify-between flex-col h-full rounded-lg w-full ">
      {/* Preview Modal */}
      <ImagePreviewModal
        isOpen={previewModalOpen}
        urls={previewURLs}
        onClose={() => {
          // revoke object URLs on cancel
          previewURLs.forEach((u) => URL.revokeObjectURL(u));
          setPreviewFiles([]);
          setPreviewURLs([]);
          setPreviewModalOpen(false);
        }}
        onSend={(caption?: string) => handleSendFromPreview(caption)}
      />

      {status === "waiting" && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-center text-gray-500 animate-pulse">
            Please wait! We are looking for a match...
          </div>

          <img
            src={Logo}
            alt="Logo"
            className="w-40 h-20 mx-auto animate-pulse"
          />
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
              <img
                src={CoffeeDonut}
                alt="Logo"
                className="w-40 h-40 mx-auto animate-pulse"
              />
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
                  src={CoffeeDonut}
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
                        className="w-40 h-20 mx-auto animate-pulse"
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
                    <div className="h-50vh">
                      {messages?.map((msg, index) => {
                        const attachment =
                          msg?.otherMessageDetails?.attachments?.[0];
                        const imgSrc =
                          attachment?.type === "image" && attachment?.url
                            ? attachment.url
                            : null;

                        const timestamp =
                          msg?.otherMessageDetails?.timestamp ??
                          msg?.timestamp ??
                          Date.now();

                        return (
                          <div
                            key={index}
                            className={`mb-2 flex ${
                              msg?.isOwnMessage
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`rounded-md px-2 py-1 text-sm ${
                                msg?.isOwnMessage
                                  ? "bg-primaryTheme text-white ml-2"
                                  : "bg-gray-200 text-gray-800 mr-2"
                              }`}
                            >
                              {!msg?.isOwnMessage && (
                                <div className="font-bold mb-1">
                                  {msg?.user?.replace(/[()]/g, "")}
                                </div>
                              )}

                              <div className="break-words">{msg?.text}</div>

                              {imgSrc && (
                                <div className="mt-2">
                                  <img
                                    src={imgSrc}
                                    alt="Message Attachment"
                                    className="max-w-full h-[20rem] rounded-md"
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              <div
                                className={`text-xs mt-1 ${
                                  msg?.isOwnMessage
                                    ? "text-white"
                                    : "text-black"
                                }`}
                              >
                                {new Date(timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {partnerIsTyping && !iamTyping && (
                        <div className="text-xs text-gray-500 mt-1">
                          <div className="bg-gray-200 px-3 py-2 rounded-2xl rounded-bl-sm inline-block">
                            <div className="flex items-center h-2">
                              <div className="dot bg-primaryTheme w-1 h-1 rounded-full animate-typing"></div>
                              <div className="dot bg-primaryTheme w-1 h-1 rounded-full animate-typing [animation-delay:200ms]"></div>
                              <div className="dot bg-primaryTheme w-1 h-1 rounded-full animate-typing [animation-delay:400ms]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />

                      {status === "waiting" && (
                        <>
                          <div className="text-center text-gray-500">
                            Please wait! We are looking for a match...
                          </div>
                          <div>
                            <img
                              src={Logo}
                              alt="Logo"
                              className="w-40 h-20 mx-auto"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
      {status === "started" && (
        <div className="input-container hidden-scrollbar p-2 flex items-center gap-2 md:mb-4 mb-0">
          {/* Text input */}
          <textarea
            value={inputMessage}
            onChange={(e) => {
              handleTyping();
              setInputMessage(e?.target?.value);
              e.target.style.height = "auto"; // Reset height
              e.target.style.height = e?.target?.scrollHeight + "px"; // Auto-expand
            }}
            onKeyDown={(e) => {
              if (e?.key === "Enter" && !e?.shiftKey) {
                e.preventDefault(); // Prevent new line
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="w-full resize-none border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme"
            rows={1}
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
            accept="image/png, image/jpeg"
            className="hidden active:mt-1" // Hide the default file input
          />
          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() && attachments?.length === 0}
            className={`bg-primaryTheme text-white p-2 rounded-full font-medium hover:bg-onHoveringPrimaryTheme transition-all ${
              !inputMessage.trim() && attachments?.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-send-horizontal"
            >
              <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
              <path d="M6 12h16" />
            </svg>
          </Button>
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
}

function UserRegistration() {
  const [username, setUsername] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Side Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const handleRegister = () => {
    if (username.trim()) {
      setIsRegistered(true);
      setError("");
    } else {
      setError("Username cannot be empty");
      inputRef?.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e?.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="flex flex-col items-center p-4 justify-center bg-white h-full w-full">
      {/* Drawer Toggle Button */}

      {/* <div className="w-full ">
        <Icon
          onClick={toggleDrawer}
          fontSize="2xl"
          className="cursor-progress"
          color="pink.700"
        >
          <CiMenuBurger />
        </Icon>
      </div> */}

      {/* Side Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        username="Harsh"
      />

      {/* Main Content */}
      <div className="text-2xl pl-2 py-4 font-bold  center w-full text-primaryTheme">
        {/* <div>Blind</div> */}
        <div className="flex justify-center items-center w-full">
          <img
            src={CoffeeDonut}
            className="w-30 h-20 center"
            alt="Blind Logo Here"
          />
        </div>
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
              {[
                "Be respectful and kind to others.",
                "Do not share personal information or photos.",
                "No harassment or hate speech allowed.",
                "Keep conversations family-friendly.",
                "If you feel uncomfortable, leave the chat immediately.",
              ].map((text, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-blue-500 font-semibold">•</span>{" "}
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <input
              ref={inputRef}
              type="text"
              autoComplete="on"
              value={username}
              onChange={(e) => setUsername(e?.target?.value)}
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
    <ChakraProvider>
      <div className="h-screen overflow-hidden w-screen">
        <div>
          <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <div className="bg-white shadow-lg rounded-lg w-full h-screen ">
              <UserRegistration />
            </div>
          </div>
        </div>
      </div>
    </ChakraProvider>
  </StrictMode>
);
