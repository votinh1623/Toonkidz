import React from 'react';
import AllRoutes from './components/AllRoutes';
import { Toaster } from 'sonner';
import "@fontsource/poppins";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/700.css";

function App() {
  return (
    <>
      <AllRoutes />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        duration={3000}
        visibleToasts={5}
        style={{
          fontFamily: '"Be Vietnam Pro", "Poppins", sans-serif',
        }}
      />
    </>
  );
}

export default App;