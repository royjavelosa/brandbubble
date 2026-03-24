import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  HStack,
  VStack,
  Switch,
  FormLabel,
} from "@chakra-ui/react";
import NarrativeCard from "../components/NarrativeCard";
import BubbleChart from "../components/BubbleChart";
import BrandTable from "../components/BrandTable";
import { getBrands, getGlobalNarrative } from "../services/api";

function Dashboard({ onSelectBrand }) {
  const [brands, setBrands] = useState([]);
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(true);
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [showRealOnly, setShowRealOnly] = useState(false);
  const [hiddenBrands, setHiddenBrands] = useState(new Set());
  const [highlightedBrands, setHighlightedBrands] = useState(new Set());

  useEffect(() => {
    fetchBrands();
    fetchNarrative();
  }, []);

  const fetchBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNarrative = async () => {
    try {
      const text = await getGlobalNarrative();
      setNarrative(text);
    } catch (error) {
      console.error("Error fetching narrative:", error);
    } finally {
      setNarrativeLoading(false);
    }
  };

  const toggleVisibility = (brandName) => {
    setHiddenBrands((prev) => {
      const next = new Set(prev);
      next.has(brandName) ? next.delete(brandName) : next.add(brandName);
      return next;
    });
  };

  const toggleHighlight = (brandName) => {
    setHighlightedBrands((prev) => {
      const next = new Set(prev);
      next.has(brandName) ? next.delete(brandName) : next.add(brandName);
      return next;
    });
  };

  const resetHighlights = () => setHighlightedBrands(new Set());

  // Memoized so BubbleChart only re-initializes when brands/filters actually change,
  // not when unrelated state like narrativeLoading updates
  const filteredBrands = useMemo(
    () =>
      (showRealOnly
        ? brands.filter((b) => b.latest_snapshot?.source_type === "real")
        : brands
      ).filter((b) => !hiddenBrands.has(b.name)),
    [brands, showRealOnly, hiddenBrands],
  );

  return (
    <Box>
      {/* Header */}
      <Box
        bg="gray.800"
        borderBottom="1px solid"
        borderColor="gray.700"
        px={6}
        py={5}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={1} align="center">
            <Text fontSize="6xl" lineHeight="1" alignSelf="stretch" display="flex" alignItems="center">
              🫧
            </Text>
            <VStack align="flex-start" spacing={0}>
              <Heading size="3xl" color="white" lineHeight="1.1">
                BrandBubble
              </Heading>
              <Text fontSize="sm" color="gray.400" letterSpacing="wide">
                Built 🫧 by{" "}
                <Text
                  as="a"
                  href="https://www.royjavelosa.elesi.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="green.400"
                  fontWeight="semibold"
                  _hover={{ color: "green.300", textDecoration: "underline" }}
                >
                  Roy Javelosa
                </Text>
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={3}>
            <FormLabel
              htmlFor="real-toggle"
              color="gray.400"
              fontSize="sm"
              mb={0}
            >
              Real data only
            </FormLabel>
            <Switch
              id="real-toggle"
              colorScheme="green"
              isChecked={showRealOnly}
              onChange={(e) => setShowRealOnly(e.target.checked)}
            />
          </HStack>
        </HStack>
      </Box>

      {/* Narrative */}
      <Container maxW="container.xl" pt={6} pb={2}>
        <NarrativeCard narrative={narrative} loading={narrativeLoading} />
      </Container>

      {/* Bubble Chart */}
      <Container maxW="container.xl" py={4}>
        {loading ? (
          <Box bg="gray.800" borderRadius="lg" overflow="hidden" position="relative">
            <svg width="100%" height="420" style={{ display: "block" }}>
              <style>{`
                @keyframes bubblePulse {
                  0%, 100% { opacity: 0.25; }
                  50% { opacity: 0.6; }
                }
              `}</style>
              {[
                { cx: "18%", cy: "48%", r: 68 },
                { cx: "36%", cy: "34%", r: 88 },
                { cx: "54%", cy: "56%", r: 52 },
                { cx: "69%", cy: "36%", r: 74 },
                { cx: "83%", cy: "57%", r: 44 },
                { cx: "14%", cy: "68%", r: 38 },
                { cx: "47%", cy: "74%", r: 58 },
                { cx: "64%", cy: "18%", r: 34 },
              ].map((b, i) => (
                <circle
                  key={i}
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.5}
                  style={{
                    animation: `bubblePulse 2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </svg>
            <Center position="absolute" bottom={4} left={0} right={0}>
              <HStack spacing={2}>
                <Spinner size="xs" color="green.500" />
                <Text fontSize="sm" color="gray.500">
                  Fetching brand sentiment data...
                </Text>
              </HStack>
            </Center>
          </Box>
        ) : (
          <BubbleChart
            brands={filteredBrands}
            onSelectBrand={onSelectBrand}
            highlightedBrands={highlightedBrands}
          />
        )}
      </Container>

      {/* Brand Table */}
      {!loading && (
        <Container maxW="container.xl" pb={8}>
          <BrandTable
            brands={brands}
            hiddenBrands={hiddenBrands}
            highlightedBrands={highlightedBrands}
            onToggleVisibility={toggleVisibility}
            onToggleHighlight={toggleHighlight}
            onResetHighlights={resetHighlights}
          />
        </Container>
      )}
    </Box>
  );
}

export default Dashboard;
