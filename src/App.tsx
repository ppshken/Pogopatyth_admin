import { Routes, Route } from "react-router";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import RequireAuth from "./pages/admin/RequireAuth";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/users/Users";
import AddUser from "./pages/admin/users/AddUser";
import EditUser from "./pages/admin/users/EditUser";
import Raidrooms from "./pages/admin/raidrooms/Raidrooms";
import RaidroomsDetail from "./pages/admin/raidrooms/RaidroomsDetail";
import Raidboss from "./pages/admin/raidboss/Raidboss";
import AddRaidboss from "./pages/admin/raidboss/AddRaidboss";
import EditRaidboss from "./pages/admin/raidboss/EditRaidboss";

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      <main className="min-h-screen">
        <Routes>
          {/* Login */}
          <Route path="/" element={<Login />} />
          <Route path="login" element={<Login />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />

            {/* User Management */}
            <Route path="users" element={<Users />} />          
            <Route path="users/add" element={<AddUser />} />
            <Route path="users/edit/:id" element={<EditUser />} />

            {/* Raidboss Management */}
            <Route path="raidboss" element={<Raidboss />} />
            <Route path="raidboss/add" element={<AddRaidboss />} />
            <Route path="raidboss/edit/:id" element={<EditRaidboss />} />

            {/* Raidrooms Management */}
            <Route path="raidrooms" element={<Raidrooms />} />
            <Route path="raidrooms/add" element={<Raidrooms />} />
            <Route path="raidrooms/raidroomsdetail/:id" element={<RaidroomsDetail />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
