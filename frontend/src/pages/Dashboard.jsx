import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Center,
  HStack,
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
        py={4}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Text fontSize="2xl">🫧</Text>
            <Heading size="md" color="white">
              BrandBubble
            </Heading>
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
          <Center h="400px">
            <Spinner size="xl" color="green.400" />
          </Center>
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
