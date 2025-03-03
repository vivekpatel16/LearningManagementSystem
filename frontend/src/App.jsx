import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import AdminDashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import AdminCourseManagement from "./pages/Admin/CourseManagement";
import Header from "./Components/Header";
import Reports from "./pages/Admin/Reports";
import AdminProfile from "./pages/Admin/Profile";
import { useSelector } from "react-redux";
import Footer from "./Components/Footer";

const PrivateRoute = ({ element, roles }) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return element;
};

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      <Header/>
      {user && <Sidebar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute element={<AdminDashboard />} roles={["admin"]} />} />
        <Route path="/admin/users" element={<PrivateRoute element={<UserManagement />} roles={["admin"]} />} />
        <Route path="/admin/courses" element={<PrivateRoute element={<AdminCourseManagement />} roles={["admin"]} />} />
        <Route path="/admin/reports" element={<PrivateRoute element={<Reports />} roles={["admin"]} />} />
        <Route path="/admin/profile" element={<PrivateRoute element={<AdminProfile />} roles={["admin"]} />} />
      </Routes>
      <Footer/>
    </>
  );
}

export default App;



