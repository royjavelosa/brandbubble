import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Box, Text } from "@chakra-ui/react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        bg="gray.700"
        border="1px solid"
        borderColor="gray.600"
        borderRadius="md"
        p={3}
        fontSize="xs"
      >
        <Text color="gray.300" mb={1}>
          {label}
        </Text>
        <Text color="green.400">
          Sentiment: {payload[0]?.value?.toFixed(3)}
        </Text>
        <Text color="blue.400">
          Volume: {payload[1]?.value?.toLocaleString()}
        </Text>
      </Box>
    );
  }
  return null;
};

function TrendChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <Box bg="gray.800" borderRadius="lg" p={6} textAlign="center">
        <Text color="gray.500">No trend data available</Text>
      </Box>
    );
  }

  const chartData = history.map((snap, index) => ({
    name: `${snap.snapshot_date} ${snap.period === "morning" ? "AM" : "PM"}`,
    sentiment: parseFloat(snap.sentiment_score),
    volume: snap.total_volume,
    source: snap.source_type,
    index,
  }));

  return (
    <Box bg="gray.800" borderRadius="lg" p={6}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#718096", fontSize: 10 }}
            tickLine={false}
            interval={7}
          />
          <YAxis
            yAxisId="sentiment"
            domain={[-1, 1]}
            tick={{ fill: "#718096", fontSize: 10 }}
            tickLine={false}
            width={40}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fill: "#718096", fontSize: 10 }}
            tickLine={false}
            width={60}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            yAxisId="sentiment"
            y={0}
            stroke="#4A5568"
            strokeDasharray="4 4"
          />
          <Line
            yAxisId="sentiment"
            type="monotone"
            dataKey="sentiment"
            stroke="#48BB78"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#48BB78" }}
          />
          <Line
            yAxisId="volume"
            type="monotone"
            dataKey="volume"
            stroke="#4299E1"
            strokeWidth={1}
            dot={false}
            strokeDasharray="4 4"
            activeDot={{ r: 3, fill: "#4299E1" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <Box mt={3} display="flex" gap={6} justifyContent="center">
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={3} h={0.5} bg="green.400" />
          <Text color="gray.500" fontSize="xs">
            Sentiment
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={3} h={0.5} bg="blue.400" />
          <Text color="gray.500" fontSize="xs">
            Volume
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default TrendChart;
