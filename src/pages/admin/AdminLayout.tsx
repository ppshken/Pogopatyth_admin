import { NavLink, Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      // Check if user is authenticated
      const session = localStorage.getItem("auth_session");
      if (!session) {
        navigate("/");
        return;
      }

      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          navigate("/");
          return;
        }

        const API_BASE = import.meta.env.VITE_API_BASE;
        const res = await fetch(`${API_BASE}/user/by_id.php?user_id=${userId}`);
        const data = await res.json();

        if (!data || !data.success) {
          navigate("/");
          return;
        }

        setUser({ id: data.data.id, name: data.data.trainer_name });
      } catch (e) {
        console.error("Failed to fetch user data", e);
        navigate("/");
      }
    };

    checkUser();
  }, [navigate]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("auth_session");
    } catch (e) {
      // ignore
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar - mobile: slide-in, desktop: static */}
        <aside
          className={
            "fixed inset-y-0 left-0 z-30 w-64 transform border-r border-gray-200 bg-white p-4 transition-transform dark:border-gray-700 dark:bg-gray-800 " +
            (open ? "translate-x-0" : "-translate-x-full") +
            // บนจอใหญ่เดิมเป็น static → ให้สูงเต็มจอด้วย
            " lg:static lg:block lg:h-screen lg:translate-x-0"
          }
          aria-hidden={!open}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              PokopartyTH
            </div>
            <button
              className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-sm lg:hidden dark:bg-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink
              to="/admin"
              end
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/users"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              Users
            </NavLink>

            <NavLink
              to="/admin/settings"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              Settings
            </NavLink>

            <NavLink
              to="/admin/raidboss"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              Raidboss
            </NavLink>

            <NavLink
              to="/admin/roomraid"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              Roomraid
            </NavLink>

            <NavLink
              to="/admin/profile"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              Profile
            </NavLink>
          </nav>
        </aside>

        {/* Backdrop for mobile when menu is open */}
        {open && (
          <div
            className="fixed inset-0 z-20 bg-black/25 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Top navbar */}
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <button
                className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-sm lg:hidden dark:bg-gray-700"
                onClick={() => setOpen((s) => !s)}
                aria-label="Open menu"
              >
                ☰
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user ? `${user.name}` : "Loading..."}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                color="red"
                outline
                className="cursor-pointer"
              >
                Sign out
              </Button>
            </div>
          </header>

          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
