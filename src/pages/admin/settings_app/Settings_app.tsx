import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  Button,
  Card,
  Label,
  TextInput,
  Textarea,
  ToggleSwitch,
  Spinner,
  Badge,
} from "flowbite-react";
import {
  HiSave,
  HiServer,
  HiDeviceMobile,
  HiSpeakerphone,
  HiCog,
  HiAdjustments,
  HiCloudUpload, // เพิ่ม icon สำหรับปุ่ม save ย่อย
} from "react-icons/hi";
import { AlertComponent } from "../../../component/alert";

// --- Types ---
interface ConfigData {
  maintenance: {
    is_active: boolean;
    message: string;
  };
  version_check: {
    android: { min_version: string; store_url: string };
    ios: { min_version: string; store_url: string };
  };
  features: {
    vip: boolean;
    feature: boolean;
  };
  announcement: {
    show: boolean;
    title: string;
    body: string;
    link: string;
  };
  general: {
    contact_line: string;
    privacy_policy: string;
  };
}

// ค่าเริ่มต้น
const initialConfig: ConfigData = {
  maintenance: { is_active: false, message: "" },
  version_check: {
    android: { min_version: "", store_url: "" },
    ios: { min_version: "", store_url: "" },
  },
  features: { vip: false, feature: false },
  announcement: { show: false, title: "", body: "", link: "" },
  general: { contact_line: "", privacy_policy: "" },
};

export default function SettingsApp() {
  const [config, setConfig] = useState<ConfigData>(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // แยก saving state เฉพาะส่วน Version เพื่อไม่ให้กระทบปุ่มหลัก
  const [savingVersion, setSavingVersion] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  // 1. Fetch Data
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${API_BASE}/api/admin/settings/edit.php`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const json = await res.json();
      if (
        json.status === "success" ||
        json.status === true ||
        json.success === true
      ) {
        setConfig(json.data);
      }
    } catch (err) {
      setError("ดึงข้อมูลไม่สำเร็จ");
      setShowAlert(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- ฟังก์ชันบันทึกข้อมูลส่วนกลาง (Reusable) ---
  // รับ data เข้ามาตรงๆ เพื่อแก้ปัญหา State ยังไม่อัปเดตตอนกด Auto Save
  const saveToBackend = async (dataToSave: ConfigData, isVersionSave = false) => {
    if (isVersionSave) setSavingVersion(true);
    else setSaving(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${API_BASE}/api/admin/settings/update.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(dataToSave),
      });

      const json = await res.json();
      if (
        json.status === true ||
        json.status === "success" ||
        json.success === true
      ) {
        setSuccessMsg("บันทึกข้อมูลสำเร็จ");
        setShowAlert(true);
      } else {
        setError("บันทึกข้อมูลไม่สำเร็จ");
        setShowAlert(true);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setShowAlert(true);
    } finally {
      setSaving(false);
      setSavingVersion(false);
    }
  };

  // 2. Handle Manual Save (ปุ่มหลักด้านบน)
  const handleSave = () => {
    saveToBackend(config);
  };

  // 3. Handle Auto Save (สำหรับ Toggle Switch)
  // เปลี่ยนค่าปุ๊บ บันทึกปั๊บ
  const handleToggleAutoSave = (
    section: keyof ConfigData,
    key: string,
    value: boolean
  ) => {
    // 1. สร้าง config ใหม่จำลองขึ้นมา
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    };
    
    // 2. อัปเดต UI ทันที
    setConfig(newConfig);

    // 3. ส่งค่าใหม่ไปบันทึกทันที
    saveToBackend(newConfig);
  };

  // 4. Handle Version Save Only (ปุ่มเฉพาะใน Card Version)
  const handleVersionSave = () => {
    saveToBackend(config, true);
  };

  // Alert Logic
  useEffect(() => {
    if (alert && msg) {
      setSuccessMsg(msg);
      setShowAlert(true);
    }
  }, [alert, msg]);

  // Auto Hide Alert
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
        setSuccessMsg(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  // Helpers สำหรับ Input ธรรมดา (ยังไม่บันทึก จนกว่าจะกดปุ่ม)
  const updateConfig = (section: keyof ConfigData, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const updateVersion = (os: "android" | "ios", key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      version_check: {
        ...prev.version_check,
        [os]: { ...prev.version_check[os], [key]: value },
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* --- Header --- */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <HiAdjustments className="h-8 w-8 text-blue-600" />
            ตั้งค่าระบบแอพ (App Config)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จัดการการตั้งค่าพื้นฐาน เวอร์ชัน และการปิดปรับปรุงระบบแบบ Real-time
          </p>
        </div>
        {/* ปุ่มบันทึกรวมด้านบน */}
        <Button color="blue" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <HiSave className="mr-2 h-5 w-5" />
              บันทึกทั้งหมด
            </>
          )}
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && showAlert && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in-down">
          <AlertComponent message={successMsg} type="success" />
        </div>
      )}
      {error && showAlert && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in-down">
          <AlertComponent message={error} type="failure" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
        
        {/* 1. Maintenance Mode */}
        <Card className="border-red-200 dark:border-red-900">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="flex items-center gap-2 text-xl leading-none font-bold text-gray-900 dark:text-white">
              <HiServer className="text-red-600" />
              Maintenance Mode
            </h5>
            {config.maintenance.is_active && (
              <Badge color="failure">Active</Badge>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={config.maintenance.is_active}
                label="เปิดใช้งานโหมดปิดปรับปรุง (บันทึกอัตโนมัติ)"
                // ใช้ handleToggleAutoSave แทน
                onChange={(checked) =>
                  handleToggleAutoSave("maintenance", "is_active", checked)
                }
                color="failure"
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="m_msg">
                  ข้อความแจ้งเตือน (User จะเห็นข้อความนี้)
                </Label>
              </div>
              <Textarea
                id="m_msg"
                rows={3}
                placeholder="เช่น ระบบกำลังปรับปรุงชั่วคราว กรุณารอสักครู่..."
                value={config.maintenance.message}
                onChange={(e) =>
                  updateConfig("maintenance", "message", e.target.value)
                }
              />
            </div>
          </div>
        </Card>

        {/* 2. Features Control */}
        <Card>
          <h5 className="flex items-center gap-2 text-xl leading-none font-bold text-gray-900 dark:text-white">
            <HiCog className="text-purple-600" />
            Features Control
          </h5>
          <div className="flex flex-col gap-6 py-4">
            <ToggleSwitch
              checked={config.features.vip}
              label="VIP (บันทึกอัตโนมัติ)"
              // Auto Save
              onChange={(checked) => handleToggleAutoSave("features", "vip", checked)}
            />
            <ToggleSwitch
              checked={config.features.feature}
              label="Feature (บันทึกอัตโนมัติ)"
              // Auto Save
              onChange={(checked) =>
                handleToggleAutoSave("features", "feature", checked)
              }
            />
          </div>
        </Card>

        {/* 3. Version Control (Full Width) */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h5 className="flex items-center gap-2 text-xl leading-none font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
              <HiDeviceMobile className="text-blue-600" />
              Version Control
            </h5>
            {/* ปุ่มบันทึกเฉพาะ Version Control */}
            <Button size="sm" color="gray" onClick={handleVersionSave} disabled={savingVersion || saving}>
                {savingVersion ? <Spinner size="sm" /> : <HiCloudUpload className="mr-2 h-4 w-4" />}
                บันทึกเวอร์ชัน
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Android */}
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <h6 className="mb-3 font-bold text-green-700 dark:text-green-400">
                Android
              </h6>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-2 block">
                    <Label>Min Version</Label>
                  </div>
                  <TextInput
                    sizing="sm"
                    placeholder="1.0.0"
                    value={config.version_check.android.min_version}
                    onChange={(e) =>
                      updateVersion("android", "min_version", e.target.value)
                    }
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label>Play Store URL</Label>
                  </div>
                  <TextInput
                    sizing="sm"
                    placeholder="https://play.google.com/..."
                    value={config.version_check.android.store_url}
                    onChange={(e) =>
                      updateVersion("android", "store_url", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* iOS */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <h6 className="mb-3 font-bold text-gray-700 dark:text-gray-300">
                iOS
              </h6>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-2 block">
                    <Label>Min Version</Label>
                  </div>
                  <TextInput
                    sizing="sm"
                    placeholder="1.0.0"
                    value={config.version_check.ios.min_version}
                    onChange={(e) =>
                      updateVersion("ios", "min_version", e.target.value)
                    }
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label>App Store URL</Label>
                  </div>
                  <TextInput
                    sizing="sm"
                    placeholder="https://apps.apple.com/..."
                    value={config.version_check.ios.store_url}
                    onChange={(e) =>
                      updateVersion("ios", "store_url", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Announcement */}
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h5 className="flex items-center gap-2 text-xl leading-none font-bold text-gray-900 dark:text-white">
              <HiSpeakerphone className="text-yellow-500" />
              Announcement
            </h5>
            <ToggleSwitch
              checked={config.announcement.show}
              // Auto Save
              onChange={(checked) =>
                handleToggleAutoSave("announcement", "show", checked)
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="mb-2 block">
                <Label>หัวข้อประกาศ</Label>
              </div>
              <TextInput
                value={config.announcement.title}
                onChange={(e) =>
                  updateConfig("announcement", "title", e.target.value)
                }
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label>รายละเอียด</Label>
              </div>
              <Textarea
                rows={3}
                value={config.announcement.body}
                onChange={(e) =>
                  updateConfig("announcement", "body", e.target.value)
                }
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label>Link (Optional)</Label>
              </div>
              <TextInput
                placeholder="https://..."
                value={config.announcement.link}
                onChange={(e) =>
                  updateConfig("announcement", "link", e.target.value)
                }
              />
            </div>
          </div>
        </Card>

        {/* 5. General Info */}
        <Card>
          <h5 className="flex items-center gap-2 text-xl leading-none font-bold text-gray-900 dark:text-white">
            <HiAdjustments className="text-gray-600" />
            General Info
          </h5>
          <div className="flex flex-col gap-3 pt-2">
            <div>
              <div className="mb-2 block">
                <Label>Line ID ติดต่อ</Label>
              </div>
              <TextInput
                addon="@"
                value={config.general.contact_line.replace("@", "")}
                onChange={(e) =>
                  updateConfig("general", "contact_line", "@" + e.target.value)
                }
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label>Privacy Policy Link</Label>
              </div>
              <TextInput
                value={config.general.privacy_policy}
                onChange={(e) =>
                  updateConfig("general", "privacy_policy", e.target.value)
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}