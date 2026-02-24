import { createBrowserRouter } from "react-router";
import Main from "../layouts/Main";
import Home from "../pages/Home";
import Login from "../components/auth/Login";
import SignUp from "../components/auth/Signup";
import Auth from "../layouts/Auth";
import Payment from "../pages/Payment";
import ATSScoreCheck from "../pages/ATSScoreCheck";
import Settings from "../pages/Settings";
import MockInterview from "../pages/MockInterview";
import LearningPathGenerator from "../pages/LearningPathGenerator";
import Jobs from "../pages/Jobs";
import JobDetail from "../pages/JobDetail";
import PostJob from "../pages/PostJob";
import MyJobs from "../pages/MyJobs";
import MyApplications from "../pages/MyApplications";
import JobApplications from "../pages/JobApplications";
import EditJob from "../pages/EditJob";
import Network from "../pages/Network";
import Messages from "../pages/Messages";
import ResumeBuilder from "../pages/ResumeBuilder";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Main,
    children: [
      {
        index: true,
        Component: Home, // public home page
      },
      {
        path: '/pricing',
        element: (
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        ),
      },
      {
        path: '/ats-score',
        element: (
          <ProtectedRoute>
            <ATSScoreCheck />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: '/mock-interview',
        element: (
          <ProtectedRoute>
            <MockInterview />
          </ProtectedRoute>
        ),
      },
      {
        path: '/learning-path',
        element: (
          <ProtectedRoute>
            <LearningPathGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: '/jobs',
        element: (
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        ),
      },
      {
        path: '/job/:id',
        element: (
          <ProtectedRoute>
            <JobDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '/post-job',
        element: (
          <ProtectedRoute>
            <PostJob />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-jobs',
        element: (
          <ProtectedRoute>
            <MyJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-applications',
        element: (
          <ProtectedRoute>
            <MyApplications />
          </ProtectedRoute>
        ),
      },
      {
        path: '/apply/:id',
        element: (
          <ProtectedRoute>
            <JobDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '/job/:id/applications',
        element: (
          <ProtectedRoute>
            <JobApplications />
          </ProtectedRoute>
        ),
      },
      {
        path: '/edit-job/:id',
        element: (
          <ProtectedRoute>
            <EditJob />
          </ProtectedRoute>
        ),
      },
      {
        path: '/network',
        element: (
          <ProtectedRoute>
            <Network />
          </ProtectedRoute>
        ),
      },
      {
        path: '/messages',
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: '/create-resume',
        element: (
          <ProtectedRoute>
            <ResumeBuilder />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/auth',
    Component: Auth,
    children: [
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'sign-up',
        Component: SignUp,
      },
    ],
  },
]);