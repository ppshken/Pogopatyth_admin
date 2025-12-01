import React, { useEffect, useState } from 'react';

// --- Types (ตรงกับ JSON ที่ API ส่งมา) ---
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
    ads_enabled: boolean;
    guest_login_enabled: boolean;
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

// ค่าเริ่มต้น (กัน Crash)
const initialConfig: ConfigData = {
  maintenance: { is_active: false, message: '' },
  version_check: { android: { min_version: '', store_url: '' }, ios: { min_version: '', store_url: '' } },
  features: { ads_enabled: true, guest_login_enabled: true },
  announcement: { show: false, title: '', body: '', link: '' },
  general: { contact_line: '', privacy_policy: '' },
};

export default function AppSettings() {
  const [config, setConfig] = useState<ConfigData>(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch Data เมื่อเข้าหน้าเว็บ
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // ยิงไปที่ API GET ปกติ
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const res = await fetch(`${API_BASE}/api/admin/settings/update.php`);
      const json = await res.json();
      if (json.status === 'success' || json.status === true) {
        setConfig(json.data);
      }
    } catch (err) {
      alert('Error fetching config');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. ฟังก์ชันบันทึกข้อมูล
  const handleSave = async () => {
    setSaving(true);
    try {
      // ยิงไปที่ API Admin Update
      const res = await fetch('https://api.pogopartyth.com/api/admin/settings/update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer ...' // อย่าลืมใส่ Token Admin ตรงนี้
        },
        body: JSON.stringify(config),
      });
      
      const json = await res.json();
      if (json.status === true || json.status === 'success') {
        alert('บันทึกการตั้งค่าเรียบร้อยแล้ว ✅');
      } else {
        alert('บันทึกไม่สำเร็จ: ' + json.message);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  // Helper สำหรับแก้ค่าใน Nested Object
  // ตัวอย่างการใช้: updateConfig('maintenance', 'message', 'Hello')
  const updateConfig = (section: keyof ConfigData, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Helper พิเศษสำหรับ Version Check (เพราะมันซ้อน 2 ชั้น)
  const updateVersion = (os: 'android' | 'ios', key: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      version_check: {
        ...prev.version_check,
        [os]: {
          ...prev.version_check[os],
          [key]: value,
        },
      },
    }));
  };

  if (loading) return <div className="p-10 text-center">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">จัดการการตั้งค่าแอพ (App Config)</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg text-white font-semibold transition ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
            }`}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. Maintenance Mode */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-red-600">
              🚨 Maintenance Mode
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium">เปิดใช้งานโหมดปิดปรับปรุง</label>
                <input
                  type="checkbox"
                  checked={config.maintenance.is_active}
                  onChange={(e) => updateConfig('maintenance', 'is_active', e.target.checked)}
                  className="w-6 h-6 text-red-600 rounded focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ข้อความแจ้งเตือน</label>
                <textarea
                  value={config.maintenance.message}
                  onChange={(e) => updateConfig('maintenance', 'message', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 2. Feature Flags */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">🛠 Features Control</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">แสดงโฆษณา (Ads)</span>
                <input
                  type="checkbox"
                  checked={config.features.ads_enabled}
                  onChange={(e) => updateConfig('features', 'ads_enabled', e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">อนุญาต Guest Login</span>
                <input
                  type="checkbox"
                  checked={config.features.guest_login_enabled}
                  onChange={(e) => updateConfig('features', 'guest_login_enabled', e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          {/* 3. Version Control */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">📱 Version Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Android */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="font-bold text-green-700 mb-3">🤖 Android</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Min Version (เช่น 1.0.5)</label>
                    <input
                      type="text"
                      value={config.version_check.android.min_version}
                      onChange={(e) => updateVersion('android', 'min_version', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Play Store URL</label>
                    <input
                      type="text"
                      value={config.version_check.android.store_url}
                      onChange={(e) => updateVersion('android', 'store_url', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* iOS */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3">🍎 iOS</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Min Version (เช่น 1.0.2)</label>
                    <input
                      type="text"
                      value={config.version_check.ios.min_version}
                      onChange={(e) => updateVersion('ios', 'min_version', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">App Store URL</label>
                    <input
                      type="text"
                      value={config.version_check.ios.store_url}
                      onChange={(e) => updateVersion('ios', 'store_url', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Announcement */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-yellow-600">📢 Announcement (Pop-up)</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">แสดงประกาศ</label>
                <input
                  type="checkbox"
                  checked={config.announcement.show}
                  onChange={(e) => updateConfig('announcement', 'show', e.target.checked)}
                  className="w-5 h-5 text-yellow-500"
                />
              </div>
              <input
                type="text"
                placeholder="หัวข้อประกาศ"
                value={config.announcement.title}
                onChange={(e) => updateConfig('announcement', 'title', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="รายละเอียด..."
                value={config.announcement.body}
                onChange={(e) => updateConfig('announcement', 'body', e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
              <input
                type="text"
                placeholder="ลิงก์ (Optional)"
                value={config.announcement.link}
                onChange={(e) => updateConfig('announcement', 'link', e.target.value)}
                className="w-full p-2 border rounded text-sm text-blue-600"
              />
            </div>
          </div>

          {/* 5. General Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">ℹ️ General Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600">Line ID ติดต่อ</label>
                <input
                  type="text"
                  value={config.general.contact_line}
                  onChange={(e) => updateConfig('general', 'contact_line', e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Privacy Policy Link</label>
                <input
                  type="text"
                  value={config.general.privacy_policy}
                  onChange={(e) => updateConfig('general', 'privacy_policy', e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}