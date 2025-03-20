import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import Profile from "./Components/Profile";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import AdminDashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import AdminCourseManagement from "./pages/Admin/CourseManagement";
import Reports from "./pages/Admin/Reports";
import InstructorDashboard from "./pages/Instructor/Dashboard";
import InstructorCourses from "./pages/Instructor/CourseManagement";
import MyCourses from "./pages/Instructor/MyCourses";
import ChapterManagement from "./pages/Instructor/ChapterManagement";
import VideoManagement from "./pages/Instructor/VideoManagement";
import CourseDetail from "./pages/Instructor/CourseDetails";
import Home from "./pages/Learner/Home";
import MyLearning from "./pages/Learner/MyLearning";
import Wishlist from "./pages/Learner/Wishlist";
import Courses from "./pages/Learner/Courses";
import CourseShow from "./pages/Learner/CourseShow";
import VideoPlayer from "./Components/VideoPlayer";

// 🚀 Role-based Private Route Component
const PrivateRoute = ({ element, roles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  
  return element;
};

// 🎯 Function to get allowed routes dynamically
const getAllowedRoutes = (role) => {
  const routes = {
    admin: ["/admin/dashboard", "/admin/users", "/admin/courses", "/admin/reports", "/profile"],
    instructor: [
      "/instructor/dashboard",
      "/instructor/courses",
      "/instructor/mycourses",
      "/instructor/courses/add-chapter",
      "/instructor/courses/add-videos",
      "/profile",
      "/instructor/mycourses/coursedetails",
      "/video-player",
    ],
    user: ["/home", "/my-learning", "/wishlist", "/profile", "/courses", "/courses/courseshow", "/video-player" ],
  };
  return routes[role] || [];
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const allowedRoutes = getAllowedRoutes(user.role);
      if (!allowedRoutes.includes(location.pathname)) {
        navigate(user.role === "admin" ? "/admin/dashboard" : user.role === "instructor" ? "/instructor/dashboard" : "/home");
      }
    }
  }, [user, navigate, location.pathname]);

  return (
    <>
      <Header />
      {user && <Sidebar />}
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

        {/* Instructor Routes */}
        <Route path="/instructor/dashboard" element={<PrivateRoute element={<InstructorDashboard />} roles={["instructor"]} />} />
        <Route path="/instructor/courses" element={<PrivateRoute element={<InstructorCourses />} roles={["instructor"]} />} />
        <Route path="/instructor/mycourses" element={<PrivateRoute element={<MyCourses />} roles={["instructor"]} />} />
        <Route path="/instructor/courses/add-chapter" element={<PrivateRoute element={<ChapterManagement />} roles={["instructor"]} />} />
        <Route path="/instructor/courses/add-videos" element={<PrivateRoute element={<VideoManagement />} roles={["instructor"]} />} />
        <Route path="/instructor/mycourses/coursedetails" element={<PrivateRoute element={<CourseDetail />} roles={["instructor"]} />} />

        {/* Learner (User) Routes */}
        <Route path="/home" element={<PrivateRoute element={<Home />} roles={["user"]} />} />
        <Route path="/my-learning" element={<PrivateRoute element={<MyLearning />} roles={["user"]} />} />
        <Route path="/wishlist" element={<PrivateRoute element={<Wishlist />} roles={["user"]} />} />
        <Route path="/courses" element={<PrivateRoute element={<Courses />} roles={["user"]} />} />
        <Route path="/courses/courseshow" element={<PrivateRoute element={<CourseShow />} roles={["user"]} />} />

        {/* Shared Profile Route */}
        <Route path="/profile" element={<PrivateRoute element={<Profile />} roles={["admin", "instructor", "user"]} />} />
        <Route path="/video-player" element={<PrivateRoute element={<VideoPlayer />} roles={["user", "instructor"]} />} />
      </Routes>
    </>
  );
}

export default App;
