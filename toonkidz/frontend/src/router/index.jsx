import { Navigate } from "react-router";
import LayoutDefault from "../layout/LayoutDefault/LayoutDefault";
import Login from "../components/auth/Login/Login";
import Signup from "../components/auth/Signup/Signup";
import { Children } from "react";
import Homepage from "../pages/Homepage/Homepage";
import CreateComic from "../pages/CreateComic/CreateComic";
import LearnEnglish from "../pages/LearnEnglish/LearnEnglish";

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
      // Thêm route cho "Học Tiếng Anh"
      {
        path: "learn-english",
        element: <LearnEnglish />
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
  }
];
