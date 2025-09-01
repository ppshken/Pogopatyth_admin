import { Navigate } from "react-router";
import { jwtDecode } from "jwt-decode";

type Props = {
  children: React.ReactNode;
};

type JwtPayload = {
  exp: number; // expiration time
  id: number;
  email: string;
  role: string;
};

export default function RequireAuth({ children }: Props) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    // ✅ Decode JWT
    const decoded = jwtDecode<JwtPayload>(token);

    // ✅ ตรวจสอบวันหมดอายุ
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    console.error("Invalid token", e);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
