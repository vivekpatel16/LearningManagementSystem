import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import AdminDashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import AdminCourseManagement from "./pages/Admin/CourseManagement";
import Reports from "./pages/Admin/Reports";
import InstructorDashboard from "./pages/Instructor/Dashboard";
import InstructorCourses from "./pages/Instructor/CourseManagement";
import Home from "./pages/Learner/Home";
import MyLearning from "./pages/Learner/MyLearning";
import Wishlist from "./pages/Learner/Wishlist";
import Courses from "./pages/Learner/Courses";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Profile from "./Components/Profile";
import { useSelector } from "react-redux";

const PrivateRoute = ({ element, roles }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return element;
};

function App() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const allowedRoutes = {
        admin: ["/admin/dashboard", "/admin/users", "/admin/courses", "/admin/reports", "/profile"],
        instructor: ["/instructor/dashboard", "/instructor/courses", "/profile"],
        user: ["/home", "/my-learning", "/wishlist", "/profile", "/courses"],
      };

      if (!allowedRoutes[user.role]?.includes(location.pathname)) {
        if (user.role === "admin") navigate("/admin/dashboard");
        else if (user.role === "instructor") navigate("/instructor/dashboard");
        else if (user.role === "user") navigate("/home");
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

        {/* User (Learner) Routes */}
        <Route path="/home" element={<PrivateRoute element={<Home />} roles={["user"]} />} />
        <Route path="/my-learning" element={<PrivateRoute element={<MyLearning />} roles={["user"]} />} />
        <Route path="/wishlist" element={<PrivateRoute element={<Wishlist />} roles={["user"]} />} />
        <Route path="/courses" element={<PrivateRoute element={<Courses />} roles={["user"]} />} />

        {/* Shared Profile Route */}
        <Route path="/profile" element={<PrivateRoute element={<Profile />} roles={["admin", "instructor", "user"]} />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
