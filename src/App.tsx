import { ChakraProvider } from "@chakra-ui/react";
import "./App.css";
import UserRegistration from "./Components/UserRegistration";


export default function App() {
  return (
    <ChakraProvider>
      <div className="h-screen overflow-hidden w-screen">
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
          <div className="bg-white shadow-lg rounded-lg w-full h-screen ">
            <UserRegistration />
          </div>
        </div>
      </div>
    </ChakraProvider>
  );
}
