import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "@/utils/axiosClient";

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosClient.get('/users/profile');
        if (response) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;