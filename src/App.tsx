import { Routes, Route } from "react-router";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import RequireAuth from "./pages/admin/RequireAuth";

// Dashboard
import Dashboard from "./pages/admin/Dashboard";

// User
import Users from "./pages/admin/users/Users";
import AddUser from "./pages/admin/users/AddUser";
import EditUser from "./pages/admin/users/EditUser";
import UserDetail from "./pages/admin/users/UserDetail";

// Raidrooms
import Raidrooms from "./pages/admin/raidrooms/Raidrooms";
import RaidroomsDetail from "./pages/admin/raidrooms/RaidroomsDetail";

//Raidboss
import Raidboss from "./pages/admin/raidboss/Raidboss";
import AddRaidboss from "./pages/admin/raidboss/AddRaidboss";
import EditRaidboss from "./pages/admin/raidboss/EditRaidboss";

//Notifications
import Notifications from "./pages/admin/notifications/Notifications";
import AddNotifications from "./pages/admin/notifications/AddNotifications";

//Events
import Events from "./pages/admin/events/Events";
import AddEvent from "./pages/admin/events/AddEvent";
import EditEvent from "./pages/admin/events/EditEvent";

//Logs
import Logs from "./pages/admin/logs/logs";

//Reports
import Reports from "./pages/admin/report/Report";

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
            <Route path="users/detail/:id" element={<UserDetail />} />

            {/* Raidboss Management */}
            <Route path="raidboss" element={<Raidboss />} />
            <Route path="raidboss/add" element={<AddRaidboss />} />
            <Route path="raidboss/edit/:id" element={<EditRaidboss />} />

            {/* Raidrooms Management */}
            <Route path="raidrooms" element={<Raidrooms />} />
            <Route path="raidrooms/detail/:id" element={<RaidroomsDetail />} />

            {/* Notifications Management */}
            <Route path="notifications" element={<Notifications />} />
            <Route path="notifications/add" element={<AddNotifications />} />

            {/* Events Management */}
            <Route path="events" element={<Events />} />
            <Route path="events/add" element={<AddEvent />} />
            <Route path="events/edit/:id" element={<EditEvent />} />

            {/* Logs Management */}
            <Route path="logs" element={<Logs />} />

            {/* Report Management */}
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
