export default function Dashboard() {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Overview
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        สรุปสถิติและข้อมูลสำคัญของระบบ
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            ผู้ใช้งาน
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            1,234
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            กิจกรรมวันนี้
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            56
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            การแจ้งเตือน
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            3
          </div>
        </div>
      </div>
    </div>
  );
}
