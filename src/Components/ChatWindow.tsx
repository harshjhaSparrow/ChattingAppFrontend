/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* ChatWindow.tsx */
import { Button } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import heart from "../../public/Beatinghearts.gif";
import LookingForPartner from "../../public/LookingForPartner.gif";
import CoffeeDonut from "../../public/coffeedonutgif.gif";
import { arrayBufferToBase64, capitalizeFirstLetters, genClientId } from "~/Utils/commonFunctions";

type Props = { username: string };

export default function ChatWindow({ username }: Props) {
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
  const [attachments, setAttachments] = useState<any[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socketRef = useRef<any>(null);

  useEffect(() => {
   const newSocket: any = io("https://chattingapp-2-o3ry.onrender.com/");
    // const newSocket: any = io("http://localhost:3999/");
    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      newSocket.emit("register-user", username);
    });

    newSocket.on("online-users", (users: string[]) => {
      setUsersOnline(users.length);
    });

    newSocket.on("my-detail", (user: any) => {
      setMyDetails(user);
    });

    newSocket.on("waiting", (message: string) => {
      setStatus("waiting");
    });

    newSocket.on("user-typing", (message: any) => {
      setpartnerIsTyping(true);
    });

    newSocket.on("user-stopped-typing", (message: any) => {
      setpartnerIsTyping(false);
    });

    newSocket.on("chat-started", (partner: any) => {
      setMatchedWith(partner);
      setPartnerId(partner.userId);
      setStatus("started");
    });

    newSocket.on("partner-disconnected", (message: any) => {
      setStatus("disconnected");
      setMatchedWith(null);
      setMessages([]);
      setPartnerId(null);
    });

    newSocket.on("receive-message", (payload: any) => {
      // handle both old and new payload shape
      if (payload && payload.message && payload.from) {
        const { message, from } = payload;
        setMessages((prev) => [
          ...prev,
          {
            id: message.id || null,
            clientMessageId: message.clientMessageId || null,
            user: `(${from})`,
            text: message.text,
            isOwnMessage: String(from) === String(myDetails?._id),
            timestamp: message.timestamp || new Date().toISOString(),
            attachments: message.attachments || [],
            imageDataUrl: message.attachments && message.attachments[0] ? message.attachments[0].data : null,
            otherMessageDetails: message,
          },
        ]);
        return;
      }

      if (payload && (payload.content || payload.type)) {
        const isOwn = String(payload.from) === String(myDetails?._id);
        if (payload.clientMessageId) {
          setMessages((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((m) => m.clientMessageId === payload.clientMessageId);
            if (idx !== -1) {
              copy[idx] = {
                ...copy[idx],
                id: payload.messageId ?? copy[idx].id,
                status: "saved",
                timestamp: payload.timestamp ?? copy[idx].timestamp,
                imageDataUrl: payload.type === "image" ? payload.content : copy[idx].imageDataUrl,
                text: payload.type === "text" ? payload.content : copy[idx].text,
                otherMessageDetails: payload,
              };
              return copy;
            } else {
              return [
                ...copy,
                {
                  id: payload.messageId ?? null,
                  clientMessageId: payload.clientMessageId ?? null,
                  user: isOwn ? myDetails?.username ?? "Me" : "Partner",
                  text: payload.type === "text" ? payload.content : undefined,
                  isOwnMessage: isOwn,
                  timestamp: payload.timestamp ?? new Date().toISOString(),
                  attachments: [],
                  imageDataUrl: payload.type === "image" ? payload.content : null,
                  otherMessageDetails: payload,
                },
              ];
            }
          });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: payload.messageId ?? null,
              user: isOwn ? myDetails?.username ?? "Me" : "Partner",
              text: payload.type === "text" ? payload.content : undefined,
              isOwnMessage: isOwn,
              timestamp: payload.timestamp ?? new Date().toISOString(),
              attachments: [],
              imageDataUrl: payload.type === "image" ? payload.content : null,
              otherMessageDetails: payload,
            },
          ]);
        }
        return;
      }
    });

    return () => {
      try {
        newSocket.off("connect");
        newSocket.off("online-users");
        newSocket.off("my-detail");
        newSocket.off("waiting");
        newSocket.off("user-typing");
        newSocket.off("user-stopped-typing");
        newSocket.off("chat-started");
        newSocket.off("partner-disconnected");
        newSocket.off("receive-message");
        newSocket.disconnect();
      } catch (err) {
        console.log(err);
      }
    };
  }, [username, myDetails?._id]);

  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (opts?: { text?: string; sendAttachments?: any[]; clientMessageId?: string }) => {
    if (!socketRef.current || !partnerId || !myDetails) return;

    const textToSend = opts?.text ?? inputMessage ?? "";
    const clientMessageId = opts?.clientMessageId ?? genClientId();
    const sendAttachments = opts?.sendAttachments ?? [];

    const message = {
      text: textToSend,
      senderId: myDetails._id,
      receiverId: partnerId,
      timestamp: new Date().toISOString(),
      messageType: sendAttachments.length > 0 ? "image" : "text",
      status: "sent",
      isOwnMessage: true,
      attachments: sendAttachments,
      clientMessageId,
      isTyping: false,
    };

    setMessages((prev) => [
      ...prev,
      {
        clientMessageId,
        id: null,
        user: myDetails.username,
        text: textToSend,
        isOwnMessage: true,
        timestamp: message.timestamp,
        attachments: sendAttachments,
        imageDataUrl: sendAttachments.length > 0 ? sendAttachments[0].data : null,
        status: "sending",
        otherMessageDetails: message,
      },
    ]);

    socketRef.current.emit("send-message", { message, to: partnerId });

    if (!opts?.sendAttachments || opts.sendAttachments.length === 0) {
      setInputMessage("");
    }
    setAttachments([]);
  };

  const handleFileChange = (event: any) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray: any[] = Array.from(files).filter((f: any) => ["image/png", "image/jpeg"].includes(f.type));

    if (fileArray.length === 0) {
      alert("Please select PNG or JPG images only.");
      return;
    }

    setAttachments(fileArray);
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      alert("Disconnecting...");
      socketRef.current.emit("manual-disconnect", { partnerId });
      setStatus("waiting");
      setMatchedWith("");
      setMessages([]);
      setPartnerId(null);
      socketRef.current.disconnect();
    }
  };

  const handleReconnect = () => {
    if (socketRef.current) {
      setStatus("waiting");
      socketRef.current.emit("register-user", username);
    }
  };

  const handleTyping = () => {
    setIamTyping(true);
    socketRef.current?.emit("user-typing", { username, to: partnerId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIamTyping(false);
      socketRef.current?.emit("user-stopped-typing", { username, to: partnerId });
    }, 2000);
  };

  return (
    <div className="bg-white flex justify-between flex-col h-full rounded-lg w-full ">
      {status === "waiting" && <div className="text-center text-gray-500">Please wait! We are looking for a match...</div>}

      {matchedWith && status !== "waiting" && (
        <div className="text-lg text-center font-semibold text-primaryTheme mb-4">
          <div className="font-bold text-center flex justify-center items-center space-x-2">
            <div className="flex items-center">
              <div>You’ve matched with: {capitalizeFirstLetters(matchedWith?.username)}</div>
              <div className="ml-2"><div className="h-2 w-2 rounded-full bg-green-500 inline-block" /></div>
            </div>
          </div>
          – <span className="italic">Your conversation just got a whole lot more interesting!</span>
        </div>
      )}

      {status === "disconnected" ? (
        <>
          <div className="text-center">{matchedWith?.userName}Partner has disconnected. We are constantly trying to match you up with someone else.</div>
          <div className="flex items-center h-full w-full justify-center mt-4"><div><img src={heart} className="w-[200px] h-[200px]" alt="" /></div></div>
          <button onClick={handleReconnect} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all mt-4">Find New Partner</button>
        </>
      ) : (
        <>
          {status === "waiting" ? (
            <div className="messages rounded-full flex justify-center items-center p-4 mb-4 h-fit overflow-y-hidden">
              <img src={LookingForPartner} className="h-[200px] rounded-full w-[00px]" alt="Partner Vector" />
            </div>
          ) : status === "connecting" ? (
            <div className="text-center flex flex-col justify-center items-center w-full h-full text-gray-500">
              <div><img src={CoffeeDonut} className="w-[150px] rounded-full h-[150px]" alt="Coffee and Donut" /></div>
              <p className="mt-4 text-lg font-medium">Hi {myDetails?.username}! Waiting to match with a new partner...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-y-auto px-3 py-2">
              <div>
                {messages?.map((msg, index) => (
                  <div key={msg.clientMessageId ?? msg.id ?? index} className={`mb-2 flex items-center ${msg.isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-md px-2 py-1 text-sm max-w-[85%] ${msg.isOwnMessage ? "bg-primaryTheme text-white ml-2" : "bg-gray-200 w-auto text-gray-800 mr-2"}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{!msg.isOwnMessage && msg.user?.replace(/[()]/g, "")}</span>
                      </div>

                      <div className="mt-1">{msg.text && <span>{msg.text}</span>}</div>

                      {msg.imageDataUrl && (
                        <div className="mt-2">
                          <img src={msg.imageDataUrl} alt="Message Attachment" className="max-w-[85%] h-auto rounded-md" />
                        </div>
                      )}

                      {msg?.attachments && msg.attachments.length > 0 && !msg.imageDataUrl && (
                        <div className="mt-2">
                          <img src={arrayBufferToBase64(msg?.attachments[0])} alt="Message Attachment" className="max-w-[85%] h-auto rounded-md" />
                        </div>
                      )}

                      <div className={`text-xs mt-1 ${!msg.isOwnMessage ? "text-black" : "text-white"}`}>
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                        {msg.status === "sending" && <span className="ml-2 text-xs opacity-80">Sending…</span>}
                        {msg.status === "saved" && <span className="ml-2 text-xs opacity-80">Saved</span>}
                        {msg.status === "failed" && <span className="ml-2 text-xs text-red-400">Failed</span>}
                      </div>
                    </div>
                  </div>
                ))}

                {partnerIsTyping && !iamTyping && (
                  <div className="text-xs text-gray-500 mt-1">
                    <div className="bg-gray-200 px-3 py-2 rounded-2xl rounded-bl-sm inline-block">
                      <div className="flex items-center h-2 gap-1">
                        <div className="dot bg-primaryTheme w-1 h-1 rounded-full animate-typing" />
                        <div className="dot bg-primaryTheme w-1 h-1 rounded-full animate-typing" style={{ animationDelay: "200ms" }} />
                        <div className="dot bg-primaryTheme w-1 h-1 rounded-full animate-typing" style={{ animationDelay: "400ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {status === "started" && (
        <div className="input-container hidden-scrollbar p-2 flex items-center gap-2 md:mb-4 mb-0">
          <textarea
            value={inputMessage}
            onChange={(e) => {
              handleTyping();
              setInputMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="w-full resize-none border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme"
            rows={1}
          />

          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="material-icons active:mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip">
                <path d="M13.234 20.252 21 12.3" />
                <path d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486" />
              </svg>
            </span>{" "}
          </label>
          <input id="file-upload" type="file" multiple onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden active:mt-1" />

          <Button onClick={() => handleSendMessage({ text: inputMessage })} disabled={!inputMessage.trim() && attachments.length === 0} className={`bg-primaryTheme text-white p-2 rounded-full font-medium hover:bg-onHoveringPrimaryTheme transition-all ${!inputMessage.trim() && attachments.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal">
              <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
              <path d="M6 12h16" />
            </svg>
          </Button>
        </div>
      )}

      {status === "started" && (
        <div className="flex md:justify-center justify-end my-2 items-center">
          <div>
            <button onClick={handleDisconnect} className="bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all">End & Find Another</button>
          </div>
        </div>
      )}

      {status === "waiting" && (
        <div className="flex items-center justify-center">
          <div className="bg-green-600 text-white w-full text-center px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all">
            <span className="italic"></span>Feel free to <span className="font-bold">refresh</span>. Maybe the universe will be kinder next time!"
          </div>
        </div>
      )}
    </div>
  );
}
