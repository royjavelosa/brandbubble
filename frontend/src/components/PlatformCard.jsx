import { Box, Text, HStack, VStack, Badge } from "@chakra-ui/react";

function PlatformCard({ platform }) {
  const sentiment = platform.platform_sentiment_score || 0;
  const platformInfo = platform.platforms || {};
  const name = platformInfo.display_name || "Unknown";

  const getSentimentColor = (score) => {
    if (score >= 0.3) return "green";
    if (score <= -0.3) return "red";
    return "yellow";
  };

  const getSentimentLabel = (score) => {
    if (score >= 0.6) return "Very Positive";
    if (score >= 0.3) return "Positive";
    if (score <= -0.6) return "Very Negative";
    if (score <= -0.3) return "Negative";
    return "Neutral";
  };

  const getPlatformColor = (platformName) => {
    const colors = {
      YouTube: "red",
      TikTok: "purple",
      Instagram: "pink",
      News: "blue",
    };
    return colors[platformName] || "gray";
  };

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      p={5}
      minW="200px"
      flex="1"
      borderTop="3px solid"
      borderColor={`${getPlatformColor(name)}.400`}
    >
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="full">
          <Text color="white" fontWeight="bold" fontSize="md">
            {name}
          </Text>
          <Badge
            colorScheme={getSentimentColor(sentiment)}
            borderRadius="full"
            px={2}
          >
            {getSentimentLabel(sentiment)}
          </Badge>
        </HStack>

        <HStack spacing={6}>
          <VStack align="start" spacing={0}>
            <Text color="gray.500" fontSize="xs">
              Sentiment
            </Text>
            <Text
              color={`${getSentimentColor(sentiment)}.400`}
              fontWeight="bold"
              fontSize="lg"
            >
              {sentiment.toFixed(3)}
            </Text>
          </VStack>
          <VStack align="start" spacing={0}>
            <Text color="gray.500" fontSize="xs">
              Mentions
            </Text>
            <Text color="white" fontWeight="bold" fontSize="lg">
              {(platform.mention_count || 0).toLocaleString()}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={4} w="full">
          <VStack align="start" spacing={0}>
            <Text color="gray.500" fontSize="xs">
              Likes
            </Text>
            <Text color="gray.300" fontSize="sm">
              {(platform.like_count || 0).toLocaleString()}
            </Text>
          </VStack>
          <VStack align="start" spacing={0}>
            <Text color="gray.500" fontSize="xs">
              Shares
            </Text>
            <Text color="gray.300" fontSize="sm">
              {(platform.share_count || 0).toLocaleString()}
            </Text>
          </VStack>
          <VStack align="start" spacing={0}>
            <Text color="gray.500" fontSize="xs">
              Comments
            </Text>
            <Text color="gray.300" fontSize="sm">
              {(platform.comment_count || 0).toLocaleString()}
            </Text>
          </VStack>
        </HStack>

        <Box w="full">
          <Text color="gray.500" fontSize="xs" mb={1}>
            Source
          </Text>
          <Badge
            colorScheme={platform.source_type === "real" ? "green" : "gray"}
            fontSize="xs"
          >
            {platform.source_type === "real" ? "Live data" : "Estimated"}
          </Badge>
        </Box>
      </VStack>
    </Box>
  );
}

export default PlatformCard;
