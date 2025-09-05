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
import Raidrooms from "./pages/admin/raidrooms/Raidrooms";
import Raidboss from "./pages/admin/raidboss/Raidboss";
import AddRaidboss from "./pages/admin/raidboss/AddRaidboss";

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

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

            <Route path="raidboss" element={<Raidboss />} />
            <Route path="raidboss/add" element={<AddRaidboss />} />
            <Route path="raidboss/edit" element={<Settings />} />

            <Route path="raidrooms" element={<Raidrooms />} />
            <Route path="raidrooms/add" element={<Raidrooms />} />
            <Route path="raidrooms/edit/:id" element={<Raidrooms />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
