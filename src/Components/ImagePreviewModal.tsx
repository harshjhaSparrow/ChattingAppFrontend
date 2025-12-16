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
  Spinner,
} from "@chakra-ui/react";

type ImagePreviewModalProps = {
  isOpen: boolean;
  urls: string[];
  onClose: () => void;
  onSend: (caption?: string) => Promise<void>; // ⬅️ async
};

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  urls,
  onClose,
  onSend,
}) => {
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCaption("");
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    try {
      setIsUploading(true);
      await onSend(caption); // wait for Cloudinary upload
      onClose(); // close only after success
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? () => {} : onClose} size="lg" isCentered>
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
            isDisabled={isUploading}
          />
        </ModalBody>

        <ModalFooter gap={3}>
          <Button
            variant="outline"
            colorScheme="red"
            onClick={onClose}
            isDisabled={isUploading}
          >
            Cancel
          </Button>

          <Button
            colorScheme="blue"
            onClick={handleSend}
            isDisabled={urls.length === 0 || isUploading}
            leftIcon={isUploading ? <Spinner size="sm" /> : undefined}
          >
            {isUploading ? "Sending..." : "Send"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImagePreviewModal;
