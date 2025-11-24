import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Label, TextInput, Select } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

export default function AddUser() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [team, setTeam] = useState("Valor");
  const [device_token, setDevice_token] = useState("");
  const [role, setRole] = useState("member");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(false);
  const [alertshow, setAlertshow] = useState(false);
  const [alertmessage, setAlertmessage] = useState("");

  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setAlertshow(false);

      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${API_BASE}/api/admin/users/add.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          email,
          username,
          password,
          friend_code: friendCode,
          level: level === "" ? 1 : level,
          team,
          device_token,
          role,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "บันทึกไม่สำเร็จ");
      }

      navigate("/admin/users", {
        state: {
          alert: "success",
          msg: data.message || "เพิ่มผู้ใช้เรียบร้อย",
        },
      });
    } catch (err) {
      setAlertmessage(getErrorMessage(err) || "เกิดข้อผิดพลาด");
      setAlertshow(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl p-4">
      <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        เพิ่มผู้ใช้ใหม่
      </h3>

      {alertshow && (
        <div className="mb-4">
          <AlertComponent message={alertmessage} type="failure" />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <TextInput
            type="email"
            placeholder="กรุณากรอก อีเมลล์"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Username</Label>
          <TextInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Password</Label>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Friend Code</Label>
          <TextInput
            type="text"
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
          />
        </div>

        <div>
          <Label>Level</Label>
          <TextInput
            type="number"
            value={level === "" ? "" : String(level)}
            onChange={(e) =>
              setLevel(e.target.value ? Number(e.target.value) : "")
            }
          />
        </div>

        <div>
          <Label>Device Token</Label>
          <TextInput
            type="text"
            value={device_token}
            onChange={(e) => setDevice_token(e.target.value)}
          />
        </div>

        <div>
          <Label>Team</Label>
          <Select
            id="team"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          >
            <option value="Valor">Valor</option>
            <option value="Instinct">Instinct</option>
            <option value="Mystic">Mystic</option>
          </Select>
        </div>

        <div>
          <Label>Role</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">InActive</option>
            <option value="banned">Banned</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Save"}
          </Button>
          <Button type="button" onClick={() => navigate(-1)} color="light">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
