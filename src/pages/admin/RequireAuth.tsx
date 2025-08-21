import { Navigate } from "react-router";

type Props = {
  children: React.ReactNode;
};

export default function RequireAuth({ children }: Props) {
  // Check localStorage for session id
  const session =
    typeof window !== "undefined" ? localStorage.getItem("auth_session") : null;

  if (!session) {
    // Not authenticated -> redirect to login
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
