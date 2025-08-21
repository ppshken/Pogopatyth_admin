import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Label, TextInput, Select } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";

export default function AddUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [team, setTeam] = useState("Mystic");
  const [loading, setLoading] = useState(false);
  const [alertshow, setAlertshow] = useState(false);
  const [alertmessage, setAlertmessage] = useState("");
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password || !trainerName || !friendCode || !level) {
      setAlertshow(true);
      setAlertmessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    try {
      // เรียก API สำหรับสมัครสมาชิก
      const API_BASE = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${API_BASE}/user/add.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          trainer_name: trainerName,
          friend_code: friendCode,
          level,
          team,
        }),
      });
      // แปลงผลลัพธ์เป็น json
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAlertshow(true);
        setAlertmessage(data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        return;
      }
      navigate("/admin/users", {
        state: { alert: "success", msg: "เพิ่มผู้ใช้สำเร็จ" },
      });
    } catch (e) {
      setLoading(false); // ปิด loading
      setAlertshow(true); // แสดง modal error
      setAlertmessage("เกิดข้อผิดพลาด"); // แจ้ง error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Create User
      </h3>

      {alertshow && (
        <div className="mb-4">
          <AlertComponent message={alertmessage} type="failure" />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Email
          </Label>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@flowbite.com"
            required
            shadow
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Password
          </Label>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            TrannerName
          </Label>
          <TextInput
            type="text"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Friend Code
          </Label>
          <TextInput
            type="text"
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
            maxLength={12}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Level
          </Label>
          <TextInput
            type="number"
            value={level === "" ? "" : String(level)}
            onChange={(e) =>
              setLevel(e.target.value ? Number(e.target.value) : "")
            }
            maxLength={2}
            placeholder="1-50"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Team
          </Label>
          <Select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option>Mystic</option>
            <option>Valor</option>
            <option>Instinct </option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading} className="cursor-pointer">
            {loading ? "Loading..." : "Save"}
          </Button>
          <Button
            type="button"
            onClick={() => navigate("/admin/users")}
            color="light"
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
