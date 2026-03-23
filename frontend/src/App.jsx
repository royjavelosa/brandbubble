import { useState } from "react";
import { Box } from "@chakra-ui/react";
import Dashboard from "./pages/Dashboard";
import BrandDetail from "./pages/BrandDetail";

function App() {
  const [selectedBrand, setSelectedBrand] = useState(null);

  return (
    <Box bg="gray.900" minH="100vh">
      {selectedBrand ? (
        <BrandDetail
          brand={selectedBrand}
          onBack={() => setSelectedBrand(null)}
        />
      ) : (
        <Dashboard onSelectBrand={setSelectedBrand} />
      )}
    </Box>
  );
}

export default App;
