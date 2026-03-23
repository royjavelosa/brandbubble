import { Box, Text, Skeleton } from "@chakra-ui/react";

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
      >
        <Skeleton
          height="16px"
          mb={2}
          startColor="gray.700"
          endColor="gray.600"
        />
        <Skeleton
          height="16px"
          mb={2}
          startColor="gray.700"
          endColor="gray.600"
        />
        <Skeleton
          height="16px"
          width="60%"
          startColor="gray.700"
          endColor="gray.600"
        />
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
      borderLeft="4px solid"
      borderColor="green.400"
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
