import { DarkThemeToggle } from "flowbite-react";
import { Routes, Route } from "react-router";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import RequireAuth from "./pages/admin/RequireAuth";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/users/Users";
import AddUser from "./pages/admin/users/AddUser";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";
import EditUser from "./pages/admin/users/EditUser";

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="absolute right-4 bottom-4">
        <DarkThemeToggle />
      </div>

      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<Users />} />
            <Route path="users/add" element={<AddUser />} />
            <Route path="users/edit/:id" element={<EditUser />} />
            <Route path="settings" element={<Settings />} />
            <Route path="raidboss" element={<Settings />} />
            <Route path="roomraid" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
