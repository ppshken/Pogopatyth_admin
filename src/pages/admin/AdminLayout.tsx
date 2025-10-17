import { NavLink, Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { DarkThemeToggle } from "flowbite-react";

//icon
import {
  IoAppsOutline,
  IoPeopleOutline,
  IoPawOutline,
  IoInvertMode,
  IoNotificationsOutline,
  IoWarningOutline,
} from "react-icons/io5";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("auth_user");

      if (!token || !userData) {
        navigate("/");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);

        // ✅ ไม่ต้องยิง API ก็ได้ เอาจาก localStorage ได้เลย
        setUser({ id: parsedUser.id, name: parsedUser.username });
      } catch (e) {
        console.error("Failed to parse user data", e);
        navigate("/");
      }
    };

    checkUser();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
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
            " overflow-y-auto lg:fixed lg:z-40 lg:block lg:h-screen lg:translate-x-0"
          }
          aria-hidden={!open}
        >
          <div className="mb-6 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                PogopartyTH
              </div>
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
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium" +
                (isActive
                  ? "bg-primary-600 dark:text-gray-200"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              <IoAppsOutline />
              แดชบอร์ด
            </NavLink>

            <NavLink
              to="/admin/users"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              <IoPeopleOutline />
              ผู้ใช้งาน
            </NavLink>

            <NavLink
              to="/admin/raidboss"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              <IoPawOutline />
              บอส
            </NavLink>

            <NavLink
              to="/admin/raidrooms"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              <IoInvertMode />
              ห้องตีบอส
            </NavLink>

            <NavLink
              to="/admin/notifications"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              <IoNotificationsOutline />
              แจ้งเตือน
            </NavLink>

            <NavLink
              to="/admin/reports"
              onClick={() => setOpen(false)}
              className={({ isActive }: { isActive: boolean }) =>
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium " +
                (isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700")
              }
            >
              <IoWarningOutline />
              รายงาน
            </NavLink>
          </nav>
          <div className="absolute right-4 bottom-4">
            <DarkThemeToggle />
          </div>
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
        <div className="flex flex-1 flex-col lg:pl-64">
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
