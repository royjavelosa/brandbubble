import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  HStack,
  Button,
  Badge,
  Divider,
} from "@chakra-ui/react";
import NarrativeCard from "../components/NarrativeCard";
import PlatformCard from "../components/PlatformCard";
import TrendChart from "../components/TrendChart";
import {
  getBrandHistory,
  getBrandPlatforms,
  getBrandNarrative,
} from "../services/api";

function BrandDetail({ brand, onBack }) {
  const [history, setHistory] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(true);
  const [narrativeLoading, setNarrativeLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, platformData] = await Promise.all([
          getBrandHistory(brand.id),
          getBrandPlatforms(brand.id),
        ]);
        setHistory(historyData);
        setPlatforms(platformData);
      } catch (error) {
        console.error("Error fetching brand data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNarrative = async () => {
      try {
        const text = await getBrandNarrative(brand.id);
        setNarrative(text);
      } catch (error) {
        console.error("Error fetching narrative:", error);
      } finally {
        setNarrativeLoading(false);
      }
    };

    fetchData();
    fetchNarrative();
  }, [brand.id]);

  const latestSnapshot = brand.latest_snapshot;
  const sentiment = latestSnapshot?.sentiment_score || 0;
  const volume = latestSnapshot?.total_volume || 0;

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

  return (
    <Box>
      {/* Header */}
      <Box
        bg="gray.800"
        borderBottom="1px solid"
        borderColor="gray.700"
        px={6}
        py={4}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              onClick={onBack}
              _hover={{ color: "white" }}
            >
              ← Back
            </Button>
            <Heading size="md" color="white">
              {brand.display_name}
            </Heading>
            <Badge
              colorScheme={getSentimentColor(sentiment)}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {getSentimentLabel(sentiment)}
            </Badge>
          </HStack>
          <HStack spacing={6}>
            <Box textAlign="right">
              <Text color="gray.400" fontSize="xs">
                Sentiment
              </Text>
              <Text
                color={`${getSentimentColor(sentiment)}.400`}
                fontWeight="bold"
                fontSize="lg"
              >
                {sentiment.toFixed(3)}
              </Text>
            </Box>
            <Box textAlign="right">
              <Text color="gray.400" fontSize="xs">
                Total mentions
              </Text>
              <Text color="white" fontWeight="bold" fontSize="lg">
                {volume.toLocaleString()}
              </Text>
            </Box>
          </HStack>
        </HStack>
      </Box>

      <Container maxW="container.xl" py={6}>
        {/* Narrative */}
        <Box mb={6}>
          <NarrativeCard
            narrative={narrative}
            loading={narrativeLoading}
            brand={brand.display_name}
          />
        </Box>

        {loading ? (
          <Center h="400px">
            <Spinner size="xl" color="green.400" />
          </Center>
        ) : (
          <>
            {/* Trend Chart */}
            <Box mb={8}>
              <Heading size="sm" color="gray.400" mb={4}>
                30-day trend
              </Heading>
              <TrendChart history={history} />
            </Box>

            <Divider borderColor="gray.700" mb={8} />

            {/* Platform Breakdown */}
            <Box>
              <Heading size="sm" color="gray.400" mb={4}>
                Platform breakdown
              </Heading>
              <HStack spacing={4} align="stretch" flexWrap="wrap">
                {platforms.map((platform) => (
                  <PlatformCard key={platform.id} platform={platform} />
                ))}
              </HStack>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

export default BrandDetail;
