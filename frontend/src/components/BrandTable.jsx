import { useState } from "react";
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

const TYPE_ORDER = { pmg_client: 0, competitor: 1, other: 2 };

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

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column)
    return <Text as="span" color="gray.600" ml={1}>⇅</Text>;
  return (
    <Text as="span" color="green.400" ml={1}>
      {sortDir === "asc" ? "▲" : "▼"}
    </Text>
  );
}

function formatVolume(v) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return `${v}`;
}

function BrandTable({
  brands,
  hiddenBrands,
  highlightedBrands,
  onToggleVisibility,
  onToggleHighlight,
  onResetHighlights,
}) {
  const [sortKey, setSortKey] = useState("sentiment");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Sentiment and volume default to descending (highest first)
      setSortDir(key === "name" || key === "type" ? "asc" : "desc");
    }
  };

  const getSentimentColor = (score) => {
    if (score >= 0.3) return "green.400";
    if (score <= -0.3) return "red.400";
    return "yellow.400";
  };

  const getBrandType = (brand) => brand.brand_type || "pmg_client";

  const sortedBrands = [...brands].sort((a, b) => {
    const typeA = getBrandType(a);
    const typeB = getBrandType(b);
    const sentA = a.latest_snapshot?.sentiment_score ?? -999;
    const sentB = b.latest_snapshot?.sentiment_score ?? -999;
    const volA = a.latest_snapshot?.total_volume ?? 0;
    const volB = b.latest_snapshot?.total_volume ?? 0;

    let cmp = 0;
    if (sortKey === "name") {
      cmp = a.display_name.localeCompare(b.display_name);
    } else if (sortKey === "type") {
      cmp = (TYPE_ORDER[typeA] ?? 3) - (TYPE_ORDER[typeB] ?? 3);
      // Secondary: alphabetical within type
      if (cmp === 0) cmp = a.display_name.localeCompare(b.display_name);
    } else if (sortKey === "sentiment") {
      cmp = sentA - sentB;
    } else if (sortKey === "volume") {
      cmp = volA - volB;
    }

    return sortDir === "asc" ? cmp : -cmp;
  });

  const thProps = (key) => ({
    color: sortKey === key ? "green.400" : "gray.500",
    fontSize: "xs",
    textTransform: "uppercase",
    py: 3,
    cursor: "pointer",
    userSelect: "none",
    _hover: { color: "green.300" },
    onClick: () => handleSort(key),
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
        <Table variant="unstyled" size="sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "220px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "90px" }} />
          </colgroup>
          <Thead>
            <Tr borderBottom="1px solid" borderColor="gray.700">
              <Th {...thProps("name")} pl={6}>
                Brand <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
              </Th>
              <Th {...thProps("type")}>
                Type <SortIcon column="type" sortKey={sortKey} sortDir={sortDir} />
              </Th>
              <Th {...thProps("sentiment")} isNumeric>
                Sentiment <SortIcon column="sentiment" sortKey={sortKey} sortDir={sortDir} />
              </Th>
              <Th {...thProps("volume")} isNumeric>
                Volume <SortIcon column="volume" sortKey={sortKey} sortDir={sortDir} />
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
                userSelect="none"
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
              const volume = brand.latest_snapshot?.total_volume ?? null;
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
                  <Td py={3} pl={6} overflow="hidden">
                    <HStack spacing={0} overflow="hidden">
                      <BrandDot type={type} />
                      <Text
                        color="white"
                        fontSize="sm"
                        fontWeight="medium"
                        isTruncated
                        title={brand.display_name}
                      >
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
                      color={sentiment !== null ? getSentimentColor(sentiment) : "gray.500"}
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      {sentiment !== null ? sentiment.toFixed(3) : "—"}
                    </Text>
                  </Td>
                  <Td py={3} isNumeric>
                    <Text color="gray.300" fontSize="sm">
                      {formatVolume(volume)}
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
