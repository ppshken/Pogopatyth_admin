export default function Settings() {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Settings
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        การตั้งค่าระบบ
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            General
          </div>
          <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
            ตั้งค่าทั่วไปของระบบ
          </div>
        </div>
      </div>
    </div>
  );
}
