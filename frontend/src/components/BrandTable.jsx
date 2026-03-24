import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Text,
  Badge,
  HStack,
} from "@chakra-ui/react";

const DOT_COLORS = {
  pmg_client: "#48bb78",
  competitor: "#63b3ed",
  other: "#a0aec0",
};

const TYPE_LABELS = {
  pmg_client: "PMG Client",
  competitor: "Competitor",
  other: "Other",
};

function BrandDot({ type }) {
  return (
    <Box
      display="inline-block"
      width="8px"
      height="8px"
      borderRadius="full"
      bg={DOT_COLORS[type] || "#a0aec0"}
      mr={2}
      flexShrink={0}
    />
  );
}

function BrandTable({
  brands,
  hiddenBrands,
  highlightedBrands,
  onToggleVisibility,
  onToggleHighlight,
  onResetHighlights,
}) {
  const getSentimentColor = (score) => {
    if (score >= 0.3) return "green.400";
    if (score <= -0.3) return "red.400";
    return "yellow.400";
  };

  const getChange = (brand) => {
    // placeholder until we have prev snapshot in API response
    return null;
  };

  const getBrandType = (brand) => {
    return brand.brand_type || "pmg_client";
  };

  const sortedBrands = [...brands].sort((a, b) => {
    const order = { pmg_client: 0, competitor: 1, other: 2 };
    return (order[getBrandType(a)] ?? 3) - (order[getBrandType(b)] ?? 3);
  });

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      overflow="hidden"
      border="1px solid"
      borderColor="gray.700"
      mt={4}
    >
      <Box px={6} py={4} borderBottom="1px solid" borderColor="gray.700">
        <Text
          color="gray.400"
          fontSize="sm"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Brands
        </Text>
      </Box>

      <Box overflowX="auto">
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr borderBottom="1px solid" borderColor="gray.700">
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                py={3}
                pl={6}
              >
                Brand
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                py={3}
              >
                Type
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                py={3}
                isNumeric
              >
                Sentiment
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                py={3}
                isNumeric
                cursor="pointer"
                onClick={onResetHighlights}
                _hover={{ color: "green.400" }}
                title="Click to reset all highlights"
              >
                Highlight ↺
              </Th>
              <Th
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                py={3}
                isNumeric
                pr={6}
              >
                Visible
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedBrands.map((brand) => {
              const type = getBrandType(brand);
              const sentiment = brand.latest_snapshot?.sentiment_score ?? null;
              const isHidden = hiddenBrands.has(brand.name);
              const isHighlighted = highlightedBrands.has(brand.name);

              return (
                <Tr
                  key={brand.id}
                  borderBottom="1px solid"
                  borderColor="gray.700"
                  opacity={isHidden ? 0.4 : 1}
                  _hover={{ bg: "gray.750" }}
                  transition="opacity 0.2s"
                >
                  <Td py={3} pl={6}>
                    <HStack spacing={0}>
                      <BrandDot type={type} />
                      <Text color="white" fontSize="sm" fontWeight="medium">
                        {brand.display_name}
                      </Text>
                    </HStack>
                  </Td>
                  <Td py={3}>
                    <Text color="gray.400" fontSize="xs">
                      {TYPE_LABELS[type] || type}
                    </Text>
                  </Td>
                  <Td py={3} isNumeric>
                    <Text
                      color={
                        sentiment !== null
                          ? getSentimentColor(sentiment)
                          : "gray.500"
                      }
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      {sentiment !== null ? sentiment.toFixed(3) : "—"}
                    </Text>
                  </Td>
                  <Td py={3} isNumeric>
                    <Checkbox
                      isChecked={isHighlighted}
                      onChange={() => onToggleHighlight(brand.name)}
                      colorScheme="yellow"
                      size="md"
                    />
                  </Td>
                  <Td py={3} isNumeric pr={6}>
                    <Checkbox
                      isChecked={!isHidden}
                      onChange={() => onToggleVisibility(brand.name)}
                      colorScheme="green"
                      size="md"
                    />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}

export default BrandTable;
