import React, { useRef, useState } from "react";
import ChatWindow from "./ChatWindow";

const UserRegistration = () => {
  const [username, setUsername] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRegister = () => {
    const name = (username || "").trim();
    if (name.length < 2) {
      setError("Please enter at least 2 characters");
      inputRef.current?.focus();
      return;
    }
    setIsRegistered(true);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-lg h-full w-full ">
      {!isRegistered ? (
        <div className="w-full h-full p-4 flex flex-col justify-between">
          <div className="text-xl font-semibold text-primaryTheme text-center mb-4">Welcome to ChatApp</div>
          <div>
            <input
              ref={inputRef}
              type="text"
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
        <ChatWindow username={username.trim()} />
      )}
    </div>
  );
};

export default UserRegistration;
