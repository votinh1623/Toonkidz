import { Navigate } from "react-router-dom";
import LayoutDefault from "../layout/LayoutDefault/LayoutDefault";
import Login from "../components/auth/Login/Login";
import Signup from "../components/auth/Signup/Signup";
import Homepage from "../pages/Homepage/Homepage";
import CreateComic from "../pages/CreateComic/CreateComic";
import LearnEnglish from "../pages/LearnEnglish/LearnEnglish";
import LibraryPage from "../pages/LibraryPage/LibraryPage";
import AdminLayout from "../layout/AdminLayout/AdminLayout";
import Dashboard from "../pages/Admin/Dashboard/Dashboard";
import UserManagement from "../pages/Admin/UserManagement/UserManagement";
import ReportingAndCensorship from "../pages/Admin/ReportingAndCensorship/ReportingAndCensorship";
import StoryManagement from "../pages/Admin/StoryManagement/StoryManagement";
import AddStory from "../components/AddStory/AddStory";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import Discover from "../pages/Discover/Discover"; // 🔹 Thêm import trang Discover

export const route = [
  {
    path: "/home",
    element: <LayoutDefault />,
    children: [
      { index: true, element: <Navigate to="homepage" replace /> },
      { path: "homepage", element: <Homepage /> },
      { path: "create-comic", element: <CreateComic /> },
      { path: "learn-english", element: <LearnEnglish /> },
      { path: "library", element: <LibraryPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // 🔹 Thêm route riêng cho Discover
  {
    path: "/discover",
    element: <LayoutDefault />,
    children: [
      { index: true, element: <Discover /> },
    ],
  },

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "users-management", element: <UserManagement /> },
      { path: "stories-management", element: <StoryManagement /> },
      { path: "stories-management/add", element: <AddStory /> },
      { path: "reports", element: <ReportingAndCensorship /> },
    ],
  },

  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  // 🔹 Redirect mặc định về Discover nếu bạn muốn
  { path: "/", element: <Navigate to="/discover" replace /> },
];
