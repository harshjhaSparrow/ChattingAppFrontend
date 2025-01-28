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
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
var react_1 = __importStar(require("react"));
var socket_io_client_1 = require("socket.io-client");
var ChatWindow = function (_a) {
    var username = _a.username;
    var _b = (0, react_1.useState)(null), socket = _b[0], setSocket = _b[1];
    var _c = (0, react_1.useState)([]), messages = _c[0], setMessages = _c[1];
    var _d = (0, react_1.useState)(""), inputMessage = _d[0], setInputMessage = _d[1];
    var _e = (0, react_1.useState)(null), partnerId = _e[0], setPartnerId = _e[1];
    var _f = (0, react_1.useState)("connecting"), status = _f[0], setStatus = _f[1];
    var _g = (0, react_1.useState)(0), usersOnline = _g[0], setUsersOnline = _g[1];
    var _h = (0, react_1.useState)(""), matchedWith = _h[0], setMatchedWith = _h[1];
    (0, react_1.useEffect)(function () {
        var newSocket = (0, socket_io_client_1.io)("http://localhost:3999/");
        setSocket(newSocket);
        newSocket.emit("register-user", username);
        newSocket.on("online-users", function (users) {
            setUsersOnline(users.length);
        });
        newSocket.on("waiting", function (message) {
            
            setStatus("waiting");
        });
        newSocket.on("matched-user", function (message) {
            setMatchedWith(message);
        });
        newSocket.on("chat-started", function (partner) {
            setPartnerId(partner.userId);
            setStatus("started");
        });
        newSocket.on("partner-disconnected", function (message) {
            
            setStatus("disconnected");
            // After a disconnection, automatically attempt to find a new match
            setMatchedWith(""); // Reset matched partner info
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
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ user: "Me", text: inputMessage }], false); });
            setInputMessage("");
        }
    };
    var handleDisconnect = function () {
        if (socket) {
            alert("Disconnecting...");
            socket.emit("disconnected"); // Disconnect from partner
            setStatus("waiting"); // Reset status to waiting
            setMatchedWith(""); // Clear matched partner info
            setMessages([]); // Clear messages
            setPartnerId(null); // Reset partner ID
        }
    };
    var handleReconnect = function () {
        if (socket) {
            setStatus("waiting");
            socket.emit("register-user", username); // Re-register to find a new partner
        }
    };
    return (react_1.default.createElement("div", { className: "bg-white flex justify-between flex-col rounded-lg w-full " },
        status === "connecting" && (react_1.default.createElement("div", { className: "text-center text-gray-500" }, "Connecting...")),
        status === "waiting" && (react_1.default.createElement("div", { className: "text-center text-gray-500" }, "Please wait! We are looking for a match...")),
        matchedWith && status !== "waiting" && (react_1.default.createElement("div", { className: "text-lg font-semibold text-primaryTheme mb-4" },
            "Matched with: ",
            react_1.default.createElement("span", { className: "font-bold" }, matchedWith))),
        status === "disconnected" ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", null,
                matchedWith,
                " has disconnected. We are constantly trying to match you up with someone else."),
            react_1.default.createElement("button", { onClick: handleReconnect, className: "bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all mt-4" }, "Find New Partner"))) : (react_1.default.createElement(react_1.default.Fragment, null,
            " ",
            react_1.default.createElement("div", { className: "messages bg-gray-100 rounded-lg p-4 mb-4 h-60 overflow-y-auto" }, messages.map(function (msg, index) { return (react_1.default.createElement("div", { key: index, className: "message mb-2" },
                react_1.default.createElement("strong", { className: "text-primaryTheme" },
                    msg.user,
                    ":"),
                " ",
                react_1.default.createElement("span", { className: "text-gray-700" }, msg.text))); })))),
        status === "started" && (react_1.default.createElement("div", { className: "input-container flex items-center gap-2 mb-4" },
            react_1.default.createElement("input", { type: "text", value: inputMessage, onChange: function (e) { return setInputMessage(e.target.value); }, onKeyDown: function (e) {
                    if (e.key === "Enter") {
                        handleSendMessage();
                    }
                }, placeholder: "Type your message...", className: "flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme" }),
            react_1.default.createElement("button", { onClick: handleSendMessage, disabled: !inputMessage.trim(), className: "bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all ".concat(!inputMessage.trim() ? "opacity-50 cursor-not-allowed" : "") }, "Send"))),
        status === "started" && (react_1.default.createElement("button", { onClick: handleDisconnect, className: "bg-primaryTheme text-white px-4 py-2 rounded-lg font-medium hover:bg-onHoveringPrimaryTheme transition-all" }, "Disconnect from partner")),
        status === "waiting" && (react_1.default.createElement("button", { onClick: handleReconnect, className: "bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all" }, "Find New Partner")),
        react_1.default.createElement("div", { className: "text-center text-sm text-gray-500 mt-4" },
            "Users Online:",
            " ",
            react_1.default.createElement("span", { className: "font-bold text-primaryTheme" }, usersOnline + 100))));
};
exports.default = ChatWindow;
