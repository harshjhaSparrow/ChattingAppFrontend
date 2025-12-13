/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  ChakraProvider,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
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
import heart from "../public/Beatinghearts.gif";
import Logo from "../public/Logo.png";
import LookingForPartner from "../public/LookingForPartner.gif";
import "./App.css";
import SidebarDrawer from "./Components/SidebarDrawer";
import CoffeeDonut from '../public/coffeedonutgif.png'
function capitalizeFirstLetters(str: string) {
  const chars: any = str.split("");
  for (let i = 0; i < chars?.length; i++) {
    if (i === 0 || chars?.[i - 1] === " ") {
      chars[i] = chars[i].toUpperCase();
    } else {
      chars[i] = chars[i].toLowerCase();
    }
  }
  return chars.join("");
}

/* ----------------------------
   ImagePreviewModal component
   ---------------------------- */
function ImagePreviewModal({
  isOpen,
  urls,
  onClose,
  onSend,
}: {
  isOpen: boolean;
  urls: string[]; // object URLs for preview
  onClose: () => void;
  onSend: (caption?: string) => void;
}) {
  const [caption, setCaption] = useState<string>("");

  // Reset caption whenever modal closes or opens
  useEffect(() => {
    if (!isOpen) setCaption("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg="gray.900" color="white" borderRadius="lg" maxW="720px">
        <ModalHeader fontSize="lg" fontWeight="semibold">
          Preview
        </ModalHeader>

        <ModalBody>
          {urls?.length === 0 ? (
            <Text>No image selected</Text>
          ) : (
            <VStack spacing={4}>
              {urls.map((url, index) => (
                <Image
                  key={index}
                  src={url}
                  alt={`preview-${index}`}
                  borderRadius="lg"
                  maxH="420px"
                  objectFit="contain"
                />
              ))}
            </VStack>
          )}

          <Input
            mt={4}
            placeholder="Write a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e?.target?.value)}
            bg="whiteAlpha.50"
            color="white"
          />
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="outline" colorScheme="red" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => {
              onSend(caption);
            }}
            isDisabled={urls?.length === 0}
          >
            Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ----------------------------
   ChatWindow component (main)
   ---------------------------- */
function ChatWindow({ username }: any) {
  const [socket, setSocket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting");
  const [usersOnline, setUsersOnline] = useState(0);
  const [matchedWith, setMatchedWith]: any = useState<any>(null);
  const [myDetails, setMyDetails] = useState<any>(null);
  const [partnerIsTyping, setpartnerIsTyping] = useState<any>(false);
  const [iamTyping, setIamTyping] = useState<any>(false);
  const [attachments, setAttachments] = useState<any[]>([]); // can be File[] or already-encoded attachments
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // preview modal state (object URLs + file references)
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewURLs, setPreviewURLs] = useState<string[]>([]);

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

    // Cleanup function to remove listeners
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
    if (!socket || !partnerId || !myDetails) {
      // close and cleanup anyway
      previewURLs.forEach((u) => URL.revokeObjectURL(u));
      setPreviewFiles([]);
      setPreviewURLs([]);
      setPreviewModalOpen(false);
      return;
    }

    // Convert selected files to base64 data URLs
    const converted: any[] = [];
    for (const file of previewFiles) {
      try {
        const dataUrl = await convertToBase64(file); // data:image/...
        converted.push({ type: "image", data: dataUrl });
      } catch (err) {
        console.error("Failed to convert image:", err);
      }
    }

    // Build message: if caption empty -> "Media"
    const finalText =
      !caption || caption.trim() === "" ? "Media" : String(caption);

    const message = {
      text: finalText,
      senderId: myDetails?._id,
      receiverId: partnerId,
      timestamp: new Date().toISOString(),
      messageType: "image",
      status: "sent",
      isOwnMessage: true,
      attachments: converted, // base64 attachments
      isTyping: false,
    };

    console.log(":messagemessagemessage", message);

    // optimistic UI: show message immediately
    setMessages((prev) => [
      ...prev,
      {
        user: myDetails?.username,
        text: finalText,
        isOwnMessage: true,
        timestamp: message.timestamp,
        otherMessageDetails: message,
        imageDataUrl: converted[0]?.data ?? null,
      },
    ]);

    // emit to server (keeps your existing shape)
    socket.emit("send-message", { message: message, to: partnerId });

    // cleanup previews and attachments
    previewURLs.forEach((u) => URL.revokeObjectURL(u));
    setPreviewFiles([]);
    setPreviewURLs([]);
    setPreviewModalOpen(false);

    // Also clear attachments/input if you used those states
    setAttachments([]);
    setInputMessage("");
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

  function arrayBufferToBase64(arrayBuffer: any) {
    // Convert ArrayBuffer to a Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create a binary string from the uint8Array
    let binaryString = "";
    for (let i = 0; i < uint8Array?.length; i++) {
      binaryString += String.fromCharCode(uint8Array?.[i]);
    }

    // Convert binary string to Base64
    const base64String = btoa(binaryString);

    // Return the Base64 string as a data URL for use in an <img> tag
    return `data:image/png;base64,${base64String}`;
  }

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
        <>
          <div className="text-center text-gray-500">
            Please wait! We are looking for a match...
          </div>
          <div>
            <img src={Logo} alt="Logo" className="w-40 h-20 mx-auto" />
          </div>
        </>
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
                    <div className="h-60vh">
                      <div> </div>
                      {messages?.map((msg, index) => {
                        // attachment detection (first attachment only)
                        const attachment =
                          msg?.otherMessageDetails?.attachments?.[0];

                        let imgSrc: string | null = null;
                        try {
                          // case: attachment is object with { data: 'data:image/...' }
                          if (
                            attachment &&
                            typeof attachment === "object" &&
                            typeof attachment?.data === "string" &&
                            attachment.data.startsWith("data:image")
                          ) {
                            imgSrc = attachment?.data;
                          }
                          // case: attachment is a plain data-url string
                          else if (
                            attachment &&
                            typeof attachment === "string" &&
                            attachment.startsWith("data:image")
                          ) {
                            imgSrc = attachment;
                          }
                          // case: attachment is an ArrayBuffer or TypedArray
                          else if (
                            attachment &&
                            (attachment instanceof ArrayBuffer ||
                              ArrayBuffer.isView(attachment))
                          ) {
                            imgSrc = arrayBufferToBase64(attachment);
                          }
                          // case: attachment object contains raw bytes in .data (Uint8Array / ArrayBuffer)
                          else if (
                            attachment &&
                            attachment?.data &&
                            (attachment?.data instanceof ArrayBuffer ||
                              ArrayBuffer.isView(attachment?.data))
                          ) {
                            imgSrc = arrayBufferToBase64(attachment?.data);
                          }
                        } catch (e) {
                          imgSrc = null;
                        }

                        const timestamp =
                          (msg?.otherMessageDetails?.timestamp ??
                            msg?.timestamp) ||
                          Date.now();

                        return (
                          <div
                            key={index}
                            className={`mb-2 flex items-center ${
                              msg?.isOwnMessage
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`rounded-md px-2 py-1 text-sm ${
                                msg?.isOwnMessage
                                  ? "bg-primaryTheme text-white ml-2"
                                  : "bg-gray-200 w-auto text-gray-800 mr-2"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                {/* User Name */}
                                <span className="font-bold">
                                  {!msg?.isOwnMessage &&
                                    msg?.user?.replace(/[()]/g, "")}
                                </span>
                              </div>

                              {/* Message Text */}
                              <div className="mt-1">
                                <Linkify
                                  componentDecorator={(
                                    decoratedHref: any,
                                    decoratedText: any,
                                    key: any
                                  ) => (
                                    <a
                                      href={decoratedHref}
                                      key={key}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline"
                                    >
                                      {decoratedText}
                                    </a>
                                  )}
                                >
                                  <span className="break-words">
                                    {msg?.text}
                                  </span>
                                </Linkify>
                              </div>

                              {/* Image Attachment (if present) */}
                              {imgSrc ? (
                                <div className="mt-2">
                                  <img
                                    src={imgSrc}
                                    alt="Message Attachment"
                                    className="max-w-[100%] h-[20rem] rounded-md"
                                  />
                                </div>
                              ) : msg?.otherMessageDetails?.attachments?.[0] ? (
                                // fallback when an attachment exists but we couldn't decode it
                                <div className="mt-2 italic text-xs text-gray-500">
                                  Sent an attachment
                                </div>
                              ) : null}

                              {/* Message Timestamp */}
                              <div
                                className={`text-xs mt-1 ${
                                  !msg?.isOwnMessage
                                    ? "text-black"
                                    : "text-white"
                                }`}
                              >
                                {new Date(timestamp).toLocaleTimeString()}
                              </div>

                              {/* Optional: Display Typing Indicator */}
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
          <img src={CoffeeDonut} className="w-30 h-20 center" alt="Blind Logo Here" />
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
