import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function AdminRoute({ children }) {
  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("cloudcart_user") || "null"
    );
  } catch {
    user = null;
  }

  if (user?.role?.toUpperCase() !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}