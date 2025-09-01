import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Login as LoginComponent } from "../component/login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("auth_token") !== null) {
      // Redirect to admin dashboard if already logged in
      navigate("/admin");
    }
  }, []);

  function validate() {
    if (!email) return "กรุณาระบุอีเมล";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) return "กรุณาระบุรหัสผ่าน";
    if (password.length < 6) return "รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${API_BASE}/api/admin/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // ✅ เก็บ token และข้อมูล user
      if (data.data?.token) {
        localStorage.setItem("auth_token", data.data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.data.user));
      }

      // ✅ redirect ไปหน้า admin dashboard
      navigate("/admin");
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Sign In
        </h2>
        {error && (
          <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>
        )}
        <LoginComponent
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
