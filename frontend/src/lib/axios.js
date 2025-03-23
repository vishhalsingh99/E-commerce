import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
  withCredentials: true, // Send cookies to the server
});

export default axiosInstance;


// Access to XMLHttpRequest at 'http://localhost:5000/api/auth/signup' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.