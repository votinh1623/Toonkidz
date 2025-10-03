import { Navigate } from "react-router";
import LayoutDefault from "../layout/LayoutDefault/LayoutDefault";
import Login from "../components/auth/Login/Login";
import Signup from "../components/auth/Signup/Signup";
import { Children } from "react";
import Homepage from "../pages/Homepage/Homepage";
import CreateComic from "../pages/CreateComic/CreateComic";

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
]