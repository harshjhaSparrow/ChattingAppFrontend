// ImagePreviewModal.tsx

import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  VStack,
  Text,
} from "@chakra-ui/react";

type Props = {
  isOpen: boolean;
  urls: string[];           // Preview URLs
  onClose: () => void;      // Close modal
  onSend: () => void;       // Trigger send action
};

export default function ImagePreviewModal({ isOpen, urls, onClose, onSend }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay backdropFilter="blur(5px)" />

      <ModalContent bg="gray.900" color="white" borderRadius="lg">
        <ModalHeader fontSize="lg" fontWeight="semibold">
          Preview
        </ModalHeader>

        <ModalBody>
          {urls.length === 0 ? (
            <Text>No image selected</Text>
          ) : (
            <VStack spacing={4}>
              {urls.map((url, index) => (
                <Image
                  key={index}
                  src={url}
                  alt="preview"
                  borderRadius="lg"
                  maxH="350px"
                  objectFit="contain"
                />
              ))}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter gap={3}>
          <Button
            variant="outline"
            colorScheme="red"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            colorScheme="blue"
            onClick={onSend}
            isDisabled={urls.length === 0}
          >
            Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
