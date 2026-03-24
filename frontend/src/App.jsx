import { useState, useRef } from "react";
import { Box } from "@chakra-ui/react";
import Dashboard from "./pages/Dashboard";
import BrandDetail from "./pages/BrandDetail";

function App() {
  const [selectedBrand, setSelectedBrand] = useState(null);
  const brandCacheRef = useRef({});

  return (
    <Box bg="gray.900" minH="100vh">
      {/* Always mounted — preserves bubble state and narrative cache on back-nav */}
      <Box display={selectedBrand ? "none" : "block"}>
        <Dashboard onSelectBrand={setSelectedBrand} />
      </Box>
      {selectedBrand && (
        <BrandDetail
          brand={selectedBrand}
          onBack={() => setSelectedBrand(null)}
          cache={brandCacheRef.current}
          onCacheUpdate={(id, data) => { brandCacheRef.current[id] = data; }}
        />
      )}
    </Box>
  );
}

export default App;
