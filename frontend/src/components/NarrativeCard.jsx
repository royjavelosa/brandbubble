import { Box, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scaleX(1); }
  50% { opacity: 0.8; transform: scaleX(1.01); }
`;

const bubbleFloat = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
  50% { transform: translateY(-4px) scale(1.05); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

function ThinkingBar({ width = "100%", delay = "0s" }) {
  return (
    <Box
      height="13px"
      width={width}
      borderRadius="full"
      mb={2}
      sx={{
        background:
          "linear-gradient(90deg, #2D3748 25%, #3D4F63 50%, #2D3748 75%)",
        backgroundSize: "400px 100%",
        animation: `${shimmer} 1.6s ease-in-out infinite`,
        animationDelay: delay,
      }}
    />
  );
}

function ThinkingBubble({ size = "8px", delay = "0s", color = "green.400" }) {
  return (
    <Box
      display="inline-block"
      width={size}
      height={size}
      borderRadius="full"
      bg={color}
      mx="2px"
      sx={{
        animation: `${bubbleFloat} 1.2s ease-in-out infinite`,
        animationDelay: delay,
      }}
    />
  );
}

function NarrativeCard({ narrative, loading, brand }) {
  if (loading) {
    return (
      <Box
        bg="gray.800"
        borderRadius="lg"
        px={6}
        py={4}
        borderLeft="4px solid"
        borderColor="green.400"
        position="relative"
        overflow="hidden"
      >
        {/* Thinking label with animated bubbles */}
        <Box display="flex" alignItems="center" mb={3} gap={2}>
          <Text
            color="green.500"
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {brand ? `${brand} insight` : "Analyzing brands"}
          </Text>
          <Box display="flex" alignItems="center" ml={1}>
            <ThinkingBubble size="5px" delay="0s" />
            <ThinkingBubble size="5px" delay="0.5s" />
            <ThinkingBubble size="5px" delay="0.4s" />
          </Box>
        </Box>

        {/* Shimmer lines */}
        <ThinkingBar width="100%" delay="0s" />
        <ThinkingBar width="92%" delay="0.1s" />
        <ThinkingBar width="60%" delay="0.2s" />
      </Box>
    );
  }

  if (!narrative || narrative.length === 0) {
    return null;
  }

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      px={6}
      py={4}
    >
      {brand && (
        <Text
          color="green.400"
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={2}
        >
          {brand} insight
        </Text>
      )}
      <Text color="gray.300" fontSize="sm" lineHeight="tall">
        {narrative}
      </Text>
    </Box>
  );
}

export default NarrativeCard;
