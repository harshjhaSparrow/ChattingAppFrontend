import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

type ImagePreviewModalProps = {
  isOpen: boolean;
  urls: string[]; // object URLs for preview
  onClose: () => void;
  onSend: (caption?: string) => void;
};

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  urls,
  onClose,
  onSend,
}) => {
  const [caption, setCaption] = useState<string>("");

  // Reset caption when modal closes
  useEffect(() => {
    if (!isOpen) setCaption("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg="gray.900" color="white" borderRadius="lg" maxW="720px">
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
                  alt={`preview-${index}`}
                  borderRadius="lg"
                  maxH="420px"
                  objectFit="contain"
                />
              ))}
            </VStack>
          )}

          <Input
            mt={4}
            placeholder="Write a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            bg="whiteAlpha.50"
            color="white"
          />
        </ModalBody>

        <ModalFooter gap={3}>
          <Button variant="outline" colorScheme="red" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => onSend(caption)}
            isDisabled={urls.length === 0}
          >
            Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImagePreviewModal;
