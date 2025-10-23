// src/router/route.js

import { Navigate } from "react-router-dom";
import LayoutDefault from "../layout/LayoutDefault/LayoutDefault";
import AdminLayout from "../layout/AdminLayout/AdminLayout";

import Login from "../components/auth/Login/Login";
import Signup from "../components/auth/Signup/Signup";

import Homepage from "../pages/Homepage/Homepage";
import CreateComic from "../pages/CreateComic/CreateComic";
import LearnEnglish from "../pages/LearnEnglish/LearnEnglish";
import LibraryPage from "../pages/LibraryPage/LibraryPage";
import StoryViewPage from "../pages/StoryViewPage/StoryViewPage";
import Dashboard from "../pages/Admin/Dashboard/Dashboard";
import UserManagement from "../pages/Admin/UserManagement/UserManagement";
import StoryManagement from "../pages/Admin/StoryManagement/StoryManagement";
import AddStory from "../components/AddStory/AddStory";
import EditStory from "../components/EditStory/EditStory";
import ReportingAndCensorship from "../pages/Admin/ReportingAndCensorship/ReportingAndCensorship";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import Discover from "../pages/Discover/Discover";
import AvailableStoriesPage from "../pages/AvailableStoriesPage/AvailableStoriesPage";

import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import Chat from "../pages/Chat/Chat";

export const route = [
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        path: "",
        element: <LayoutDefault />,
        children: [
          { index: true, element: <Navigate to="home/homepage" replace /> },

          {
            path: "home",
            children: [
              { index: true, element: <Navigate to="homepage" replace /> },
              { path: "homepage", element: <Homepage /> },
              { path: "create-comic", element: <CreateComic /> },
              { path: "learn-english", element: <LearnEnglish /> },
              { path: "library", element: <LibraryPage /> },
              { path: "library-favorites", element: <AvailableStoriesPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "chat", element: <Chat /> },
              { path: "profile/:userId", element: <ProfilePage /> },
              { path: "story/:storyId", element: <StoryViewPage /> },
              { path: "edit-story/:storyId", element: <EditStory /> },
            ],
          },

          {
            path: "discover",
            children: [
              { index: true, element: <Discover /> },
            ],
          },
        ],
      },

      {
        path: "admin",
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <Dashboard /> },
              { path: "users-management", element: <UserManagement /> },
              { path: "stories-management", element: <StoryManagement /> },
              { path: "stories-management/add", element: <AddStory /> },
              { path: "stories-management/edit/:storyId", element: <EditStory /> },
              { path: "reports", element: <ReportingAndCensorship /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
];
