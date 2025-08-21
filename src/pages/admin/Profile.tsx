import { useEffect, useState } from "react";

type ProfileData = {
  id: number;
  email: string;
  trainer_name: string;
  friend_code: string;
  level: number;
  team: string;
  created_at: string;
};

const MOCK_PROFILE: ProfileData = {
  id: 24,
  email: "test@gmail.com",
  trainer_name: "Test",
  friend_code: "253468467879",
  level: 10,
  team: "mystic",
  created_at: "2025-07-08 13:32:19",
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE ?? "";
      const session =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_session")
          : null;

      // If we don't have a session and no API configured, immediately use mock for easier dev
      if (!session && !API_BASE) {
        setProfile(MOCK_PROFILE);
        setRaw({ note: "no session and no API_BASE, using MOCK_PROFILE" });
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session) {
        headers["X-SESSION-ID"] = session;
        headers["Authorization"] = `Bearer ${session}`;
      }

      const target = API_BASE ? `${API_BASE}/get_profile.php` : "/api/profile";
      setLastUrl(target);
      const res = await fetch(target, { headers });

      // try to read raw body safely
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        data = text;
      }
      setRaw({ status: res.status, body: data });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const p = data?.profile ?? data?.user ?? data;

      setProfile({
        id: Number(p?.id ?? p?.user_id ?? 0),
        email: p?.email ?? "",
        trainer_name: p?.trainer_name ?? p?.name ?? "",
        friend_code: p?.friend_code ?? "",
        level: Number(p?.level ?? 0),
        team: p?.team ?? "",
        created_at: p?.created_at ?? "",
      });
    } catch (e) {
      setError("ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ — แสดงข้อมูลจำลอง");
      setProfile(MOCK_PROFILE);
      setRaw({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Profile
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            ข้อมูลบัญชีผู้ใช้งาน
          </p>
        </div>

        <div>
          <button
            onClick={() => loadProfile()}
            className="bg-primary-600 rounded-md px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            กำลังโหลดโปรไฟล์...
          </div>
        ) : error ? (
          <div className="rounded-lg border bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20">
            {error}
          </div>
        ) : profile ? (
          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  ชื่อผู้ฝึก
                </div>
                <div className="mt-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                  {profile.trainer_name}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  อีเมล
                </div>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {profile.email}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Friend Code
                </div>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {profile.friend_code}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  ทีม
                </div>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {profile.team}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  เลเวล
                </div>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {profile.level}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  สร้างเมื่อ
                </div>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {profile.created_at}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            ไม่มีข้อมูลโปรไฟล์
          </div>
        )}
      </div>

      {/* Debug info */}
      {(lastUrl || raw) && (
        <div className="mt-4 rounded-md border bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900">
          <div className="font-medium">Debug</div>
          {lastUrl && <div className="mt-1">URL: {lastUrl}</div>}
          {raw && (
            <pre className="mt-2 max-h-48 overflow-auto text-xs">
              {JSON.stringify(raw, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
