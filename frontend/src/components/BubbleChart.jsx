import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Text } from "@chakra-ui/react";

function BubbleChart({ brands, onSelectBrand, highlightedBrands }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const width = svgRef.current.parentElement.offsetWidth;
        setDimensions({ width, height: Math.max(550, width * 0.65) });
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

    const getOpacity = (name) => {
      if (highlightedBrands.size === 0) return 1;
      return highlightedBrands.has(name) ? 1 : 0.15;
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    svg.attr("width", width).attr("height", height);

    const defs = svg.append("defs");

    const maxVolume = d3.max(brands, (b) => b.latest_snapshot?.total_volume || 0);
    const totalVolume = d3.sum(brands, (b) => b.latest_snapshot?.total_volume || 0);

    const fillRatio = 0.61;
    const maxRadius = Math.sqrt(
      (fillRatio * width * height * maxVolume) / (Math.PI * totalVolume),
    );
    const minRadius = Math.max(20, maxRadius * 0.22);

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxVolume])
      .range([0, maxRadius]);

    const nodes = brands.map((brand) => {
      const baseColor = getSentimentColor(brand.latest_snapshot?.sentiment_score || 0);
      const gradId = `grad-${brand.name.replace(/[^a-zA-Z0-9]/g, "")}`;

      // Transparent dark center → color builds up near the edge only
      const grad = defs
        .append("radialGradient")
        .attr("id", gradId)
        .attr("cx", "50%").attr("cy", "50%")
        .attr("r", "50%");

      grad.append("stop").attr("offset", "0%")
        .attr("stop-color", baseColor).attr("stop-opacity", 0.40);
      grad.append("stop").attr("offset", "78%")
        .attr("stop-color", baseColor).attr("stop-opacity", 0.40);
      grad.append("stop").attr("offset", "88%")
        .attr("stop-color", baseColor).attr("stop-opacity", 0.78);
      grad.append("stop").attr("offset", "95%")
        .attr("stop-color", baseColor).attr("stop-opacity", 0.97);
      grad.append("stop").attr("offset", "100%")
        .attr("stop-color", baseColor).attr("stop-opacity", 1.0);

      return {
        ...brand,
        gradId,
        baseColor,
        radius: Math.max(minRadius, radiusScale(brand.latest_snapshot?.total_volume || 0)),
        sentiment: brand.latest_snapshot?.sentiment_score || 0,
        volume: brand.latest_snapshot?.total_volume || 0,
        x: width / 2 + (Math.random() - 0.5) * width * 0.7,
        y: height / 2 + (Math.random() - 0.5) * height * 0.7,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 0.008 + Math.random() * 0.006,
        wanderStrength: 0.25 + Math.random() * 0.2,
      };
    });

    function wanderForce() {
      nodes.forEach((node) => {
        node.wanderAngle += node.wanderSpeed;
        node.vx += Math.cos(node.wanderAngle) * node.wanderStrength;
        node.vy += Math.sin(node.wanderAngle) * node.wanderStrength;
      });
    }

    if (simulationRef.current) simulationRef.current.stop();

    const simulation = d3
      .forceSimulation(nodes)
      .alphaDecay(0)
      .velocityDecay(0.35)
      .force("wander", wanderForce)
      .force("repulsion", d3.forceManyBody().strength(-18))
      .force("x", d3.forceX(width / 2).strength(0.015))
      .force("y", d3.forceY(height / 2).strength(0.015))
      .force("collision", d3.forceCollide((d) => d.radius + 10).strength(0.85));

    simulationRef.current = simulation;

    const bubbleGroup = svg.append("g");

    const bubbles = bubbleGroup
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => onSelectBrand(d))
      .on("mouseover", function (event, d) {
        if (highlightedBrands.size > 0 && !highlightedBrands.has(d.name)) return;
        d3.select(this).select("circle")
          .transition().duration(180)
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.85);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).select("circle")
          .transition().duration(220)
          .attr("stroke", d.baseColor)
          .attr("stroke-width", 1)
          .attr("stroke-opacity", getOpacity(d.name) * 0.9);
      });

    bubbles
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => `url(#${d.gradId})`)
      .attr("fill-opacity", (d) => getOpacity(d.name))
      // Colored stroke for a crisp glowing ring edge
      .attr("stroke", (d) => d.baseColor)
      .attr("stroke-width", 1)
      .attr("stroke-opacity", (d) => getOpacity(d.name) * 0.9);

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

    return () => simulation.stop();
  }, [brands, dimensions, onSelectBrand, highlightedBrands]);

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
