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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Main,
    children: [
        {
            index: true,
            Component: Home,
        },
        {
          path: '/pricing',
          Component: Payment,
        },
        {
          path: '/ats-score',
          Component: ATSScoreCheck,
        },
        {
          path: '/settings',
          Component: Settings,
        },
        {
          path: '/mock-interview',
          Component: MockInterview
        },
        {
          path: '/learning-path',
          Component: LearningPathGenerator
        },
        {
          path: '/jobs',
          Component: Jobs
        },
        {
          path: '/job/:id',
          Component: JobDetail
        },
        {
          path: '/post-job',
          Component: PostJob,
        },
        {
          path: '/my-jobs',
          Component: MyJobs,
        },
        {
          path: '/my-applications',
          Component: MyApplications,
        },
        {
          path: '/apply/:id',
          Component: JobDetail
        },
        {
          path: '/job/:id/applications',
          Component: JobApplications,
        },
        {
          path: '/edit-job/:id',
          Component: EditJob
        },
        {
          path: '/network',
          Component: Network
        },
        {
          path:'/messages',
          Component: Messages,
        },
        {
          path: '/create-resume',
          Component: ResumeBuilder,
        }
    ]
  },
  {
    path: '/auth',
    Component: Auth,
    children: [
      {
        path: 'login',
        Component: Login
      },
      {
        path: 'sign-up',
        Component: SignUp
      }
    ]
  }
]);