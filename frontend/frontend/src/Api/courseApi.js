import axios from "axios";

const Courses_API = axios.create({ baseURL: "http://localhost:5000/api/courses" });

Courses_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default Courses_API;
