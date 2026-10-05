import { lazy } from "react";
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));
import { createBrowserRouter } from "react-router";
import { Navigate } from "react-router";
import Main from "../layouts/Main";
import Home from "../pages/Home";
const Login = lazy(() => import("../components/auth/Login"));
const SignUp = lazy(() => import("../components/auth/Signup"));
import Auth from "../layouts/Auth";
const Payment = lazy(() => import("../pages/Payment"));
const ATSScoreCheck = lazy(() => import("../pages/ATSScoreCheck"));
const Settings = lazy(() => import("../pages/Settings"));
const MockInterview = lazy(() => import("../pages/MockInterview"));
const LearningPathGenerator = lazy(() => import("../pages/LearningPathGenerator"));
const Jobs = lazy(() => import("../pages/Jobs"));
const JobDetail = lazy(() => import("../pages/JobDetail"));
const PostJob = lazy(() => import("../pages/PostJob"));
const MyJobs = lazy(() => import("../pages/MyJobs"));
const MyApplications = lazy(() => import("../pages/MyApplications"));
const JobApplications = lazy(() => import("../pages/JobApplications"));
const EditJob = lazy(() => import("../pages/EditJob"));
const Network = lazy(() => import("../pages/Network"));
const Messages = lazy(() => import("../pages/Messages"));
const CVBuilder = lazy(() => import("../pages/CVBuilder"));
const ResumeBuilder = lazy(() => import("../pages/ResumeBuilder"));
import ProtectedRoute from "../components/ProtectedRoute";

// Admin components
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminUsers = lazy(() => import("../pages/AdminUsers"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const AdminJobs = lazy(() => import("../pages/AdminJobs")); // new
import ModeratorRoute from "../components/ModeratorRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Main,
    children: [
      { path: "/notifications", element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      {
        index: true,
        Component: Home,
      },
      {
        path: "/pricing",
        element: (
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        ),
      },
      {
        path: "/ats-score",
        element: (
          <ProtectedRoute>
            <ATSScoreCheck />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/mock-interview",
        element: (
          <ProtectedRoute>
            <MockInterview />
          </ProtectedRoute>
        ),
      },
      {
        path: "/learning-path",
        element: (
          <ProtectedRoute>
            <LearningPathGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: "/jobs",
        element: (
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "/job/:id",
        element: (
          <ProtectedRoute>
            <JobDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/post-job",
        element: (
          <ProtectedRoute>
            <PostJob />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my-jobs",
        element: (
          <ProtectedRoute>
            <MyJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my-applications",
        element: (
          <ProtectedRoute>
            <MyApplications />
          </ProtectedRoute>
        ),
      },
      {
        path: "/apply/:id",
        element: (
          <ProtectedRoute>
            <JobDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/job/:id/applications",
        element: (
          <ProtectedRoute>
            <JobApplications />
          </ProtectedRoute>
        ),
      },
      {
        path: "/edit-job/:id",
        element: (
          <ProtectedRoute>
            <EditJob />
          </ProtectedRoute>
        ),
      },
      {
        path: "/network",
        element: (
          <ProtectedRoute>
            <Network />
          </ProtectedRoute>
        ),
      },
      {
        path: "/messages",
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      { path: "/create-cv", element: <ProtectedRoute><CVBuilder /></ProtectedRoute> },
      { path: "/cv", element: <Navigate to="/create-cv" replace /> },
      {
        path: "/create-resume",
        element: (
          <ProtectedRoute>
            <ResumeBuilder />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/auth",
    Component: Auth,
    children: [
      {
        path: "login",
        Component: Login,
      },
      {
        path: "sign-up",
        Component: SignUp,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ModeratorRoute>
        <AdminLayout />
      </ModeratorRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "users",
        element: <AdminUsers />,
      },
      {
        path: "jobs",
        element: <AdminJobs />, // new
      },
    ],
  },
]);