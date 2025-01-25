"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var react_1 = __importDefault(require("react"));
var UserRegistration_1 = __importDefault(require("./Components/UserRegistration"));
var App = function () {
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("div", { className: "min-h-screen bg-gray-100 flex flex-col items-center justify-center" },
            react_1.default.createElement("div", { className: "bg-white shadow-lg rounded-lg w-full max-w-md p-6" },
                react_1.default.createElement("h1", { className: "text-2xl font-bold text-center text-primaryTheme mb-6" }, "Chat App"),
                react_1.default.createElement(UserRegistration_1.default, null)))));
};
exports.App = App;
