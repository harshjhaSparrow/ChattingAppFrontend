import React from "react";

interface IsRegisteredGuidelinesProps {
  inputRef: React.RefObject<HTMLInputElement>;
  username: string;
  setUsername: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRegister: () => void;
  error?: string;
}

const IsRegisteredGuidelines: React.FC<IsRegisteredGuidelinesProps> = ({
  inputRef,
  username,
  setUsername,
  handleKeyDown,
  handleRegister,
  error,
}) => {
  return (
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
              <span className="mr-2 text-blue-500 font-semibold">•</span>
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
          onChange={(e) => setUsername(e.target.value)}
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
  );
};

export default IsRegisteredGuidelines;
