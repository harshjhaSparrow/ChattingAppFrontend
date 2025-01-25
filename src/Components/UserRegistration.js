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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var ChatWindow_1 = __importDefault(require("./ChatWindow"));
var UserRegistration = function () {
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
    return (react_1.default.createElement("div", { className: "flex flex-col items-center justify-center bg-white rounded-lg h-full w-full " }, !isRegistered ? (react_1.default.createElement("div", { className: "w-full h-full p-4 flex flex-col justify-between" },
        react_1.default.createElement("div", { className: "text-xl font-semibold text-primaryTheme text-center mb-4" }, "Welcome to ChatApp"),
        react_1.default.createElement("div", null,
            react_1.default.createElement("input", { ref: inputRef, type: "text", value: username, onChange: function (e) { return setUsername(e.target.value); }, onKeyDown: handleKeyDown, placeholder: "Enter your username", className: "w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme" }),
            error && react_1.default.createElement("p", { className: "text-red-500 text-sm mb-2" }, error),
            react_1.default.createElement("button", { onClick: handleRegister, className: "w-full bg-primaryTheme text-white font-medium py-2 rounded-lg hover:bg-onHoveringPrimaryTheme transition-all" }, "Register")))) : (react_1.default.createElement(ChatWindow_1.default, { username: username }))));
};
exports.default = UserRegistration;
