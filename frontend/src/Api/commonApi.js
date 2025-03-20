import axios from "axios";

const common_API = axios.create({ baseURL: "http://localhost:5000/api/users" });

common_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default common_API;
