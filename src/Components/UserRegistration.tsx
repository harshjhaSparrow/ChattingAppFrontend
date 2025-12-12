import React, { useRef, useState } from "react";
import { Icon } from "@chakra-ui/react";
import { CiMenuBurger } from "react-icons/ci";
import SidebarDrawer from "./SidebarDrawer";
import ChatWindow from "./ChatWindow";

export default function UserRegistration() {
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
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="flex flex-col items-center p-4 justify-center bg-white h-full w-full">
      <div className="w-full ">
        <Icon onClick={toggleDrawer} fontSize="2xl" className="cursor-progress" color="pink.700">
          <CiMenuBurger />
        </Icon>
      </div>

      <SidebarDrawer isOpen={isDrawerOpen} onClose={toggleDrawer} username="Harsh" />

      <div className="text-2xl pl-2 py-4 font-bold w-full text-center text-primaryTheme">
        <div>Blind</div>
      </div>

      {!isRegistered ? (
        <div className="w-full h-full py-6 px-4 flex flex-col justify-between">
          <div className="text-xl font-semibold text-primaryTheme text-center mb-4">Welcome to ChatApp</div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow-md max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Chat Guidelines</h2>
            <ul className="space-y-3 text-gray-700 text-base">
              {[
                "Be respectful and kind to others.",
                "Do not share personal information or photos.",
                "No harassment or hate speech allowed.",
                "Keep conversations family-friendly.",
                "If you feel uncomfortable, leave the chat immediately.",
              ].map((text, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-blue-500 font-semibold">•</span> {text}
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
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primaryTheme"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button onClick={handleRegister} className="w-full bg-primaryTheme text-white font-medium py-2 rounded-lg hover:bg-onHoveringPrimaryTheme transition-all">
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
