import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, verifyAuth } from "./features/auth/authSlice";

import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import TidioChat from "./Components/TidioChat";
import Profile from "./Components/Profile";
import VideoPlayer from "./Components/VideoPlayer";

import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

import AdminDashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import AdminCourseManagement from "./pages/Admin/CourseManagement";
import Reports from "./pages/Admin/Reports";
import Category from "./pages/Admin/Category";

import InstructorDashboard from "./pages/Instructor/Dashboard";
import InstructorCourses from "./pages/Instructor/CourseManagement";
import MyCourses from "./pages/Instructor/MyCourses";
import QuizEditor from "./pages/Instructor/QuizEditor";
import CourseDetail from "./pages/Instructor/CourseDetails";

import Home from "./pages/Learner/Home";
import MyLearning from "./pages/Learner/MyLearning";
import Wishlist from "./pages/Learner/Wishlist";
import Courses from "./pages/Learner/Courses";
import CourseShow from "./pages/Learner/CourseShow";
import QuizAttempt from "./pages/Learner/QuizAttempt";

import './app.css'; // or './index.css'

// Secure PrivateRoute component
const PrivateRoute = ({ element, roles }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyUserAuth = async () => {
      try {
        if (!user) {
          dispatch(logout());
          navigate("/");
          return;
        }

        const storedUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        if (!token || !storedUser) {
          dispatch(logout());
          navigate("/");
          return;
        }

        try {
          const jwtPayload = JSON.parse(atob(token.split('.')[1]));

          if (storedUser.role !== jwtPayload.role) {
            dispatch(logout());
            navigate("/");
            return;
          }

          if (roles && !roles.includes(storedUser.role)) {
            if (storedUser.role === "admin") navigate("/admin/dashboard");
            else if (storedUser.role === "instructor") navigate("/instructor/dashboard");
            else if (storedUser.role === "user") navigate("/home");
            return;
          }

          setVerifying(false);
        } catch (error) {
          dispatch(logout());
          navigate("/");
        }
      } catch (error) {
        console.error("Authentication error in PrivateRoute:", error);
        dispatch(logout());
        navigate("/");
      }
    };

    verifyUserAuth();
  }, [dispatch, navigate, roles, user]);

  if (verifying || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return element;
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthRoute = ['/', '/forgot-password', '/reset-password'].includes(location.pathname);

  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthRoute) {
      document.body.classList.remove('auth-page');
      document.body.style.overflow = 'auto';
    }
  }, [isAuthRoute, location.pathname]);

  useEffect(() => {
    const initialAuthCheck = async () => {
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user"));

      if (isAuthRoute && token && storedUser) {
        try {
          const jwtPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          if (jwtPayload.exp && jwtPayload.exp > currentTime) {
            if (storedUser.role === "admin") navigate("/admin/dashboard");
            else if (storedUser.role === "instructor") navigate("/instructor/dashboard");
            else if (storedUser.role === "user") navigate("/home");
            setInitializing(false);
            return;
          }
        } catch (error) {
          console.error("Token validation error:", error);
        }
      }

      if (!isAuthRoute) {
        if (!token || !storedUser) {
          navigate("/");
          setInitializing(false);
          return;
        }

        try {
          if (!user) {
            await dispatch(verifyAuth()).unwrap();
          }
        } catch (error) {
          console.error("Auth verification failed:", error);
          navigate("/");
        }
      }

      setInitializing(false);
    };

    initialAuthCheck();
  }, [dispatch, navigate, location.pathname, user, isAuthRoute]);

  if (initializing) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header toggleSidebar={toggleSidebar} />
      {user && <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute element={<AdminDashboard />} roles={["admin"]} />} />
        <Route path="/admin/users" element={<PrivateRoute element={<UserManagement />} roles={["admin"]} />} />
        <Route path="/admin/courses" element={<PrivateRoute element={<AdminCourseManagement />} roles={["admin"]} />} />
        <Route path="/admin/reports" element={<PrivateRoute element={<Reports />} roles={["admin"]} />} />
        <Route path="/admin/category" element={<PrivateRoute element={<Category />} roles={["admin"]} />} />

        {/* Instructor Routes */}
        <Route path="/instructor/dashboard" element={<PrivateRoute element={<InstructorDashboard />} roles={["instructor"]} />} />
        <Route path="/instructor/courses" element={<PrivateRoute element={<InstructorCourses />} roles={["instructor"]} />} />
        <Route path="/instructor/mycourses" element={<PrivateRoute element={<MyCourses />} roles={["instructor"]} />} />
        <Route path="/instructor/mycourses/coursedetails" element={<PrivateRoute element={<CourseDetail />} roles={["instructor"]} />} />
        <Route path="/instructor/quiz-editor" element={<PrivateRoute element={<QuizEditor />} roles={["instructor"]} />} />

        {/* Learner Routes */}
        <Route path="/home" element={<PrivateRoute element={<Home />} roles={["user"]} />} />
        <Route path="/my-learning" element={<PrivateRoute element={<MyLearning />} roles={["user"]} />} />
        <Route path="/wishlist" element={<PrivateRoute element={<Wishlist />} roles={["user"]} />} />
        <Route path="/courses" element={<PrivateRoute element={<Courses />} roles={["user"]} />} />
        <Route path="/courses/courseshow/:courseId" element={<PrivateRoute element={<CourseShow />} roles={["user"]} />} />
        <Route path="/quiz-attempt" element={<PrivateRoute element={<QuizAttempt />} roles={["user"]} />} />
        <Route path="/video-player" element={<PrivateRoute element={<VideoPlayer />} roles={["user"]} />} />

        {/* Shared Profile */}
        <Route path="/profile" element={<PrivateRoute element={<Profile />} roles={["admin", "instructor", "user"]} />} />
      </Routes>

      {/* Global Responsive Auth Page CSS */}
      <style jsx="true">{`
        @media (max-width: 768px) {
          .auth-page .login-wrapper {
            padding-top: 60px !important;
          }
        }
      `}</style>
    </>
  );
}

export default App;
