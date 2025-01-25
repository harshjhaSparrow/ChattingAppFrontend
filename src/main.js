"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
var react_1 = __importStar(require("react"));
var client_1 = require("react-dom/client");
var socket_io_client_1 = require("socket.io-client");
require("./App.css");
// import { capitalizeFirstLetters } from "./Utils/Commonfunctions";
var LookingForPartner_gif_1 = __importDefault(require("../public/LookingForPartner.gif"));
var coffeedonutgif_gif_1 = __importDefault(require("../public/coffeedonutgif.gif"));
function capitalizeFirstLetters(str) {
    // Convert string to array of characters
    var chars = str.split("");
    // Capitalize the first letter of each word
    for (var i = 0; i < chars.length; i++) {
        if (i === 0 || chars[i - 1] === " ") {
            chars[i] = chars[i].toUpperCase();
        }
        else {
            chars[i] = chars[i].toLowerCase();
        }
    }
    // Join the characters back into a string
    return chars.join("");
}
function ChatWindow(_a) {
    var username = _a.username;
    console.log("recieved is : username", username);
    var _b = (0, react_1.useState)(null), socket = _b[0], setSocket = _b[1];
    var _c = (0, react_1.useState)([]), messages = _c[0], setMessages = _c[1];
    var _d = (0, react_1.useState)(""), inputMessage = _d[0], setInputMessage = _d[1];
    var _e = (0, react_1.useState)(null), partnerId = _e[0], setPartnerId = _e[1];
    var _f = (0, react_1.useState)("connecting"), status = _f[0], setStatus = _f[1];
    var _g = (0, react_1.useState)(0), usersOnline = _g[0], setUsersOnline = _g[1];
    var _h = (0, react_1.useState)(null), matchedWith = _h[0], setMatchedWith = _h[1];
    (0, react_1.useEffect)(function () {
        var audio = new Audio("https://www.soundjay.com/button/beep-07.wav"); // 1-second beep sound
        audio.play().catch(function (error) {
            console.error("Error playing audio:", error);
        });
        // Optional cleanup
        return function () {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);
    (0, react_1.useEffect)(function () {
        var newSocket = (0, socket_io_client_1.io)("http://localhost:3999/");
        setSocket(newSocket);
        newSocket.emit("register-user", username);
        newSocket.on("online-users", function (users) {
            setUsersOnline(users.length);
        });
        newSocket.on("waiting", function (message) {
            console.log("message", message);
            setStatus("waiting");
        });
        newSocket.on("matched-user", function (message) {
            console.log("Matche duser is L: ", message);
        });
        newSocket.on("chat-started", function (partner) {
            console.log("partnechatr", partner);
            setMatchedWith(partner);
            setPartnerId(partner.userId);
            setStatus("started");
        });
        newSocket.on("partner-disconnected", function (message) {
            console.log("partner-disconnected", message);
            setStatus("disconnected");
            // After a disconnection, automatically attempt to find a new match
            setMatchedWith(null); // Reset matched partner info
            setMessages([]); // Clear message history
            setPartnerId(null); // Reset partner ID
        });
        newSocket.on("receive-message", function (_a) {
            var message = _a.message, from = _a.from;
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                { user: "Partner (".concat(from, ")"), text: message },
            ], false); });
        });
        return function () {
            newSocket.disconnect();
        };
    }, [username]);
    var handleSendMessage = function () {
        if (socket && partnerId) {
            socket.emit("send-message", { message: inputMessage, to: partnerId });
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                { user: "Me", text: inputMessage, isOwnMessage: true },
            ], false); });
            setInputMessage("");
        }
    };
    var handleDisconnect = function () {
        if (socket) {
            alert("Disconnecting...");
            // Notify the server of manual disconnect
            socket.emit("manual-disconnect", { partnerId: partnerId });
            // Update the local state
            setStatus("waiting"); // Reset status to waiting
            setMatchedWith(""); // Clear matched partner info
            setMessages([]); // Clear messages
            setPartnerId(null); // Reset partner ID
            // Optionally disconnect the socket completely
            socket.disconnect();
        }
    };
    var handleReconnect = function () {
        if (socket) {
            setStatus("waiting");
            socket.emit("register-user", username); // Re-register to find a new partner
        }
    };
    var handleTyping = function () {
        socket.emit("user-typing", {
            username: username, // Your username
            to: partnerId, // Recipient's ID
        });
    };
    return (react_1.default.createElement("div", { className: "bg-white flex justify-between flex-col h-full rounded-lg w-full " },
        status === "connecting" && (react_1.default.createElement("div", { className: "text-center flex justify-center items-center w-full h-full text-gray-500" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("img", { src: coffeedonutgif_gif_1.default, className: "w-[150px] h-[100px]", alt: "" })))),
        status === "waiting" && (react_1.default.createElement("div", { className: "text-center text-gray-500" }, "Please wait! We are looking for a match...")),
        matchedWith && status !== "waiting" && (react_1.default.createElement("div", { className: "text-lg text-center font-semibold text-primaryTheme mb-4" },
            "You\u2019ve matched with:",
            " ",
            react_1.default.createElement("span", { className: "font-bold" }, capitalizeFirstLetters(matchedWith === null || matchedWith === void 0 ? void 0 : matchedWith.username)),
            " ",
            "\u2013",
            " ",
            react_1.default.createElement("span", { className: "italic" }, "Your conversation just got a whole lot more interesting!"))),
        status === "disconnected" ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", null, matchedWith === null || matchedWith === void 0 ? void 0 :
                matchedWith.userName,
                "Partner has disconnected. We are constantly trying to match you up with someone else."),
            react_1.default.createElement("button", { onClick: handleReconnect, className: "bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all mt-4" }, "Find New Partner"))) : (react_1.default.createElement(react_1.default.Fragment, null,
            " ",
            status === "waiting" ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "messages rounded-full flex justify-center items-center  p-4 mb-4 h-fit overflow-y-hidden" },
                    react_1.default.createElement("img", { src: LookingForPartner_gif_1.default, className: "h-[200px] rounded-full w-[00px]", alt: "Partner Vector" })))) : (react_1.default.createElement(react_1.default.Fragment, null, status === "connecting" ? (react_1.default.createElement(react_1.default.Fragment, null, "Conecting")) : (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "flex flex-col h-60 overflow-y-auto" },
                    react_1.default.createElement("div", null, messages === null || messages === void 0 ? void 0 : messages.map(function (msg, index) { return (react_1.default.createElement("div", { key: index, className: "mb-2 flex items-center ".concat(msg.isOwnMessage ? "justify-end" : "justify-start") },
                        react_1.default.createElement("div", { className: "rounded-md px-2 py-1 text-sm ".concat(msg.isOwnMessage
                                ? "bg-primaryTheme text-white ml-2"
                                : "bg-gray-200 text-gray-800 mr-2") },
                            react_1.default.createElement("span", null, msg.text)))); }))))))))),
        status === "started" && (react_1.default.createElement("div", { className: "input-container flex items-center gap-2 mb-4" },
            react_1.default.createElement("input", { type: "text", value: inputMessage, onChange: function (e) {
                    setInputMessage(e.target.value);
                    handleTyping();
                }, onKeyDown: function (e) {
                    if (e.key === "Enter") {
                        handleSendMessage();
                    }
                }, placeholder: "Type your message...", className: "flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme" }),
            react_1.default.createElement("button", { onClick: handleSendMessage, disabled: !inputMessage.trim(), className: "bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all ".concat(!inputMessage.trim() ? "opacity-50 cursor-not-allowed" : "") }, "Send"))),
        status === "started" && (react_1.default.createElement("div", { className: "flex items-center justify-center" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("button", { onClick: handleDisconnect, className: "bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all" }, "Disconnect from partner")))),
        status === "waiting" && (react_1.default.createElement("div", { className: "flex items-center justify-center" },
            react_1.default.createElement("div", { className: "bg-green-600 text-white w-full text-center px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all" },
                react_1.default.createElement("span", { className: "italic" }, "that"),
                " unpopular. Feel free to",
                " ",
                react_1.default.createElement("span", { className: "font-bold" }, "refresh"),
                ". Maybe the universe will be kinder next time!\"")))));
}
function UserRegistration() {
    var _a = (0, react_1.useState)(""), username = _a[0], setUsername = _a[1];
    var _b = (0, react_1.useState)(false), isRegistered = _b[0], setIsRegistered = _b[1];
    var _c = (0, react_1.useState)(""), error = _c[0], setError = _c[1];
    var inputRef = (0, react_1.useRef)(null);
    var handleRegister = function () {
        var _a;
        if (username.trim()) {
            setIsRegistered(true);
            setError("");
        }
        else {
            setError("Username cannot be empty");
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    };
    var handleKeyDown = function (e) {
        if (e.key === "Enter") {
            handleRegister();
        }
    };
    return (react_1.default.createElement("div", { className: "flex flex-col items-center p-4 justify-center bg-white h-full w-full " },
        react_1.default.createElement("div", { className: "text-2xl pl-8 py-4 left font-bold w-full text-center text-primaryTheme" },
            react_1.default.createElement("div", null, "Blind"),
            react_1.default.createElement("div", null)),
        !isRegistered ? (react_1.default.createElement("div", { className: "w-full h-full py-6 px-4 flex flex-col justify-between" },
            react_1.default.createElement("div", { className: "text-xl font-semibold text-primaryTheme text-center mb-4" }, "Welcome to ChatApp"),
            react_1.default.createElement("div", { className: "bg-gray-50 p-6 rounded-2xl shadow-md max-w-lg mx-auto" },
                react_1.default.createElement("h2", { className: "text-xl font-semibold text-gray-800 mb-4 text-center" }, "Chat Guidelines"),
                react_1.default.createElement("ul", { className: "space-y-3 text-gray-700 text-base" },
                    react_1.default.createElement("li", { className: "flex items-start" },
                        react_1.default.createElement("span", { className: "mr-2 text-blue-500 font-semibold" }, "\u2022"),
                        " Be respectful and kind to others."),
                    react_1.default.createElement("li", { className: "flex items-start" },
                        react_1.default.createElement("span", { className: "mr-2 text-blue-500 font-semibold" }, "\u2022"),
                        " Do not share personal information or photos."),
                    react_1.default.createElement("li", { className: "flex items-start" },
                        react_1.default.createElement("span", { className: "mr-2 text-blue-500 font-semibold" }, "\u2022"),
                        " No harassment or hate speech allowed."),
                    react_1.default.createElement("li", { className: "flex items-start" },
                        react_1.default.createElement("span", { className: "mr-2 text-blue-500 font-semibold" }, "\u2022"),
                        " Keep conversations family-friendly."),
                    react_1.default.createElement("li", { className: "flex items-start" },
                        react_1.default.createElement("span", { className: "mr-2 text-blue-500 font-semibold" }, "\u2022"),
                        " If you feel uncomfortable, leave the chat immediately."))),
            react_1.default.createElement("div", null,
                react_1.default.createElement("input", { ref: inputRef, type: "text", autoComplete: "on", value: username, onChange: function (e) { return setUsername(e.target.value); }, onKeyDown: handleKeyDown, placeholder: "Enter your username", className: "w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme" }),
                error && react_1.default.createElement("p", { className: "text-red-500 text-sm mb-2" }, error),
                react_1.default.createElement("button", { onClick: handleRegister, className: "w-full bg-primaryTheme text-white font-medium py-2 rounded-lg hover:bg-onHoveringPrimaryTheme transition-all" }, "Register")))) : (react_1.default.createElement(ChatWindow, { username: username }))));
}
(0, client_1.createRoot)(document.getElementById("root")).render(react_1.default.createElement(react_1.StrictMode, null,
    react_1.default.createElement("div", { className: "h-screen overflow-hidden w-screen" },
        react_1.default.createElement("div", null,
            react_1.default.createElement("div", { className: "min-h-screen bg-gray-100 flex flex-col items-center justify-center" },
                react_1.default.createElement("div", { className: "bg-white shadow-lg rounded-lg w-full h-screen " },
                    react_1.default.createElement(UserRegistration, null)))))));
