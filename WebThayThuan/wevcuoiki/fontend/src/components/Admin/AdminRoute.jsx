import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../services/AuthService";

export default function AdminRoute({ children }) {
  const user = getCurrentUser();

  if (!user || !user.token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}



