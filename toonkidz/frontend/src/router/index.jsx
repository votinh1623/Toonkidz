import { Navigate } from "react-router";
import LayoutDefault from "../layout/LayoutDefault/LayoutDefault";
import Login from "../components/auth/Login/Login";
import Signup from "../components/auth/Signup/Signup";
import Homepage from "../pages/Homepage/Homepage";
import Dashboard from '../components/Dashboard'; // Testing
import CreateComic from "../pages/CreateComic/CreateComic";
import LearnEnglish from "../pages/LearnEnglish/LearnEnglish";
import LibraryPage from "../pages/LibraryPage/LibraryPage";

export const route = [
  {
    path: "/home",
    element: <LayoutDefault />,
    children: [
      {
        index: true,
        element: <Navigate to="homepage" replace />
      },
      {
        path: "homepage",
        element: <Homepage />
      },
      {
        path: "create-comic",
        element: <CreateComic />
      },
      {
        path: "learn-english",
        element: <LearnEnglish />
      },
      {
        path: "library",
        element: <LibraryPage />
      },
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/",
    element: <Signup />
  },
  {
    path: "/dashboard",
    element: <Dashboard /> // ✅ Dashboard route added for testing
  },
];
