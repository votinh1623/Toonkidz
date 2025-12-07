import React from 'react';
import AllRoutes from './components/AllRoutes';
import "@fontsource/poppins";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/700.css";
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
function App() {
  return (
    <>
      <AllRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#4caf50',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#4caf50',
            },
          },
          error: {
            style: {
              background: '#ef5350',
            },
          },
        }}
      />
    </>
  );
}

export default App;