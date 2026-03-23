import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Text } from "@chakra-ui/react";

function BubbleChart({ brands, onSelectBrand }) {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const width = svgRef.current.parentElement.offsetWidth;
        setDimensions({ width, height: Math.max(500, width * 0.6) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!brands || brands.length === 0) return;

    const getSentimentColor = (score) => {
      if (score >= 0.3) {
        const intensity = Math.min((score - 0.3) / 0.7, 1);
        const g = Math.round(150 + intensity * 105);
        return `rgb(0, ${g}, 80)`;
      }
      if (score <= -0.3) {
        const intensity = Math.min((-score - 0.3) / 0.7, 1);
        const r = Math.round(150 + intensity * 105);
        return `rgb(${r}, 50, 50)`;
      }
      return "rgb(200, 160, 0)";
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    svg.attr("width", width).attr("height", height);

    const maxVolume = d3.max(brands, (b) => b.latest_snapshot?.total_volume || 0);
    const minVolume = d3.min(brands, (b) => b.latest_snapshot?.total_volume || 0);

    const radiusScale = d3
      .scaleSqrt()
      .domain([minVolume, maxVolume])
      .range([30, 90]);

    const nodes = brands.map((brand) => ({
      ...brand,
      radius: radiusScale(brand.latest_snapshot?.total_volume || 0),
      sentiment: brand.latest_snapshot?.sentiment_score || 0,
      volume: brand.latest_snapshot?.total_volume || 0,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide((d) => d.radius + 4))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    const bubbleGroup = svg.append("g");

    const bubbles = bubbleGroup
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        onSelectBrand(d);
      });

    bubbles
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => getSentimentColor(d.sentiment))
      .attr("fill-opacity", 0.85)
      .attr("stroke", (d) => getSentimentColor(d.sentiment))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.4)
      .on("mouseover", function () {
        d3.select(this).attr("fill-opacity", 1).attr("stroke-opacity", 0.8);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 0.85).attr("stroke-opacity", 0.4);
      });

    bubbles
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-size", (d) => Math.max(10, d.radius / 4))
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text((d) => d.display_name);

    bubbles
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("font-size", (d) => Math.max(8, d.radius / 5.5))
      .attr("pointer-events", "none")
      .attr("dy", (d) => d.radius / 3.5)
      .text((d) => d.sentiment.toFixed(2));

    simulation.on("tick", () => {
      bubbles.attr("transform", (d) => {
        d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
        d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
        return `translate(${d.x}, ${d.y})`;
      });
    });
  }, [brands, dimensions, onSelectBrand]);

  if (!brands || brands.length === 0) {
    return (
      <Box
        bg="gray.800"
        borderRadius="lg"
        p={6}
        textAlign="center"
        h="400px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500">No brand data available</Text>
      </Box>
    );
  }

  return (
    <Box bg="gray.800" borderRadius="lg" overflow="hidden">
      <svg ref={svgRef} style={{ display: "block" }} />
    </Box>
  );
}

export default BubbleChart;
