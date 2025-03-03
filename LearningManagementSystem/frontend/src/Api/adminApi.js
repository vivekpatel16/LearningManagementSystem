import axios from "axios";

const Admin_API = axios.create({ baseURL: "http://localhost:5000/api/admin" });

Admin_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default Admin_API;
