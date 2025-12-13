import { Icon } from "@chakra-ui/react";
import React, { useRef, useState } from "react";
import { CiMenuBurger } from "react-icons/ci";
import Logo from '../../public/Logo.png';
import IsRegisteredGuidelines from "./IsRegisteredGuidelines";
import SidebarDrawer from "./SidebarDrawer";
import ChatWindow from "./ChatWindow";

 const UserRegistration=()=> {
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

      <div className="w-full ">
        <Icon
          onClick={toggleDrawer}
          fontSize="2xl"
          className="cursor-progress"
          color="pink.700"
        >
          <CiMenuBurger />
        </Icon>
      </div>

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
          <img src={Logo} className="w-3 h-50 center" alt="Blind Logo Here" />
        </div>
      </div>

      {!isRegistered ? (
        <IsRegisteredGuidelines
          inputRef={inputRef}
          username={username}
          setUsername={setUsername}
          handleKeyDown={handleKeyDown}
          handleRegister={handleRegister}
          error={error}
        />
      ) : (
        <ChatWindow username={username} />
      )}
    </div>
  );
}

export default UserRegistration;
