/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  Avatar,
  HStack,
  VStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Box,
  Badge,
  Divider,
  Button,
  Flex,
  Spacer,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiHome, FiSettings, FiHelpCircle, FiSearch, FiLogOut, FiStar, FiUsers } from "react-icons/fi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  avatarUrl?: string | null;
  version?: string;
};

const navItems = [
  { id: "home", label: "Home", icon: FiHome, hint: "Overview" },
  { id: "discover", label: "Discover", icon: FiStar, hint: "Explore new people" },
  { id: "people", label: "People", icon: FiUsers, hint: "Your network" },
  { id: "settings", label: "Settings", icon: FiSettings, hint: "Preferences" },
  { id: "help", label: "Help", icon: FiHelpCircle, hint: "Support & docs" },
];

export default function SidebarDrawer({ isOpen, onClose, username = "You", avatarUrl = null, version = "v1.0.0" }: Props) {
  const glassBg = useColorModeValue("rgba(255,255,255,0.06)", "rgba(0,0,0,0.36)");
  const subtle = useColorModeValue("rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)");

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
      <DrawerOverlay
        bg="blackAlpha.600"
        backdropFilter="blur(6px) saturate(1.05)"
        transition="opacity 220ms ease"
      />
      <DrawerContent
        bgGradient="linear(to-b, rgba(12,17,23,0.9), rgba(8,10,12,0.95))"
        color="white"
        borderRightWidth={0}
        maxW="320px"
        px={0}
        py={4}
        boxShadow="xl"
      >
        <DrawerBody px={4} py={6}>
          {/* Header / Profile */}
          <HStack spacing={3} mb={4} alignItems="center">
            <Avatar
              name={username}
              src={avatarUrl ?? undefined}
              size="md"
              showBorder
              borderColor="whiteAlpha.200"
              boxShadow="sm"
            />
            <VStack spacing={0} alignItems="flex-start">
              <Text fontWeight="semibold" fontSize="md" lineHeight="1">
                {username}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle" px={2} py={0.5}>
                  Online
                </Badge>
                <Text fontSize="xs" color="whiteAlpha.700">
                  Active now
                </Text>
              </HStack>
            </VStack>
            <Spacer />
            <IconButton
              aria-label="Close navigation"
              icon={<FiLogOut />}
              size="sm"
              variant="ghost"
              color="whiteAlpha.800"
              _hover={{ bg: subtle }}
              onClick={onClose}
            />
          </HStack>

          {/* Search */}
          <Box mb={5}>
            <InputGroup>
              <InputLeftElement pointerEvents="none" children={<FiSearch color="rgba(255,255,255,0.65)" />} />
              <Input
                placeholder="Search people, topics..."
                bg={glassBg}
                border="1px solid rgba(255,255,255,0.04)"
                _placeholder={{ color: "whiteAlpha.600" }}
                py={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // optional: implement quick-search
                    // keep simple for now
                  }
                }}
              />
            </InputGroup>
          </Box>

          <Divider borderColor="whiteAlpha.100" mb={4} />

          {/* Navigation list */}
          <VStack align="stretch" spacing={2}>
            {navItems.map((item) => (
              <NavRow key={item.id} label={item.label} hint={item.hint} Icon={item.icon} onClick={() => {
                // handle navigation in parent as needed
                // close drawer for now
                onClose();
              }} />
            ))}
          </VStack>

          <Box mt={6} mb={4} px={1}>
            <Text fontSize="sm" color="whiteAlpha.700" mb={2}>
              Quick actions
            </Text>
            <Flex gap={2} wrap="wrap">
              <Button size="sm" colorScheme="blue" variant="solid" leftIcon={<FiStar />}>
                Star
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<FiUsers />}>
                Invite
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<FiHelpCircle />}>
                Support
              </Button>
            </Flex>
          </Box>

          <Spacer />

          {/* Footer */}
          <Box mt={6} pt={4} borderTop="1px solid" borderColor="whiteAlpha.50">
            <HStack justify="space-between" align="center">
              <VStack spacing={0} align="flex-start">
                <Text fontSize="xs" color="whiteAlpha.700">App version</Text>
                <Text fontSize="sm" fontWeight="semibold">{version}</Text>
              </VStack>

              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FiLogOut />}
                  onClick={() => {
                    // emit logout or call parent handler
                    // For now just close drawer
                    onClose();
                  }}
                >
                  Log out
                </Button>
              </HStack>
            </HStack>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

/* small NavRow component for each item */
function NavRow({ label, hint, Icon, onClick }: { label: string; hint?: string; Icon: any; onClick?: () => void }) {
  return (
    <Box
      as="button"
      onClick={onClick}
      w="full"
      textAlign="left"
      px={3}
      py={3}
      borderRadius="12px"
      _hover={{ bg: "whiteAlpha.030", transform: "translateY(-2px)" }}
      transition="all 180ms ease"
      display="flex"
      alignItems="center"
    >
      <HStack spacing={3}>
        <Box
          bg="whiteAlpha.030"
          p={2}
          borderRadius="10px"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="sm"
        >
          <Icon size={18} />
        </Box>
        <VStack spacing={0} align="flex-start" lineHeight="1">
          <Text fontSize="sm" fontWeight="medium">{label}</Text>
          {hint && <Text fontSize="xs" color="whiteAlpha.600">{hint}</Text>}
        </VStack>
      </HStack>
    </Box>
  );
}
