import React from "react";
import UserRegistration from "./Components/UserRegistration";

export const App = () => {
  return (
    <div>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-6">
          <h1 className="text-2xl font-bold text-center text-primaryTheme mb-6">
            Chat App
          </h1>
          <UserRegistration />
        </div>
      </div>
    </div>
  );
};
