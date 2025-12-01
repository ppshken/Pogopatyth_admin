<?php
// api/admin/settings/update.php
declare(strict_types=1);

require_once __DIR__ . '/../../helpers.php'; // ปรับ path ตามจริง
cors();

// 1. Handle Preflight & Method
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { jsonResponse(false, null, 'Method not allowed', 405); }

try {
    $db = pdo();
    
    // 2. Authentication & Admin Check
    // (สมมติว่าคุณมี authGuard ที่คืนค่า user_id)
    $adminId = authGuard(); 
    if (!$adminId) jsonResponse(false, null, 'Unauthorized', 401);

    // ตรวจสอบว่าเป็น Admin จริงหรือไม่ (Optional: ถ้าใน Token ไม่ได้ระบุ Role)
    // $stmtAdmin = $db->prepare("SELECT role FROM users WHERE id = :id");
    // $stmtAdmin->execute([':id' => $adminId]);
    // $userRole = $stmtAdmin->fetchColumn();
    // if ($userRole !== 'admin') jsonResponse(false, null, 'Forbidden', 403);

    // 3. รับ Data JSON
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        jsonResponse(false, null, 'Invalid JSON', 400);
    }

    // 4. Prepare Data Mapping
    // เราจะดึงค่าจาก nested JSON มา map เข้า column ใน DB
    // ใช้ ?? เพื่อกัน Error กรณีส่งมาไม่ครบ
    
    // Group: Maintenance
    $maintenanceMode    = (int)($input['maintenance']['is_active'] ?? 0);
    $maintenanceMsg     = trim($input['maintenance']['message'] ?? '');

    // Group: Version
    $minAndroid         = trim($input['version_check']['android']['min_version'] ?? '1.0.0');
    $urlAndroid         = trim($input['version_check']['android']['store_url'] ?? '');
    $minIos             = trim($input['version_check']['ios']['min_version'] ?? '1.0.0');
    $urlIos             = trim($input['version_check']['ios']['store_url'] ?? '');

    // Group: Features
    $enableAds          = (int)($input['features']['ads_enabled'] ?? 1);
    $enableGuest        = (int)($input['features']['guest_login_enabled'] ?? 1);

    // Group: Announcement
    $showAnnounce       = (int)($input['announcement']['show'] ?? 0);
    $announceTitle      = trim($input['announcement']['title'] ?? '');
    $announceBody       = trim($input['announcement']['body'] ?? '');
    $announceLink       = trim($input['announcement']['link'] ?? '');

    // Group: General
    $contactLine        = trim($input['general']['contact_line'] ?? '');
    $privacyUrl         = trim($input['general']['privacy_policy'] ?? '');

    // 5. Execute Update
    // อัปเดตที่ ID = 1 เสมอ
    $sql = "
        UPDATE system_configs SET
            maintenance_mode    = :m_mode,
            maintenance_message = :m_msg,
            min_version_android = :v_android,
            store_url_android   = :s_android,
            min_version_ios     = :v_ios,
            store_url_ios       = :s_ios,
            enable_ads          = :ads,
            enable_guest_login  = :guest,
            show_announcement   = :a_show,
            announcement_title  = :a_title,
            announcement_body   = :a_body,
            announcement_link   = :a_link,
            contact_line_id     = :contact,
            privacy_policy_url  = :privacy
        WHERE id = 1
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':m_mode'    => $maintenanceMode,
        ':m_msg'     => $maintenanceMsg,
        ':v_android' => $minAndroid,
        ':s_android' => $urlAndroid,
        ':v_ios'     => $minIos,
        ':s_ios'     => $urlIos,
        ':ads'       => $enableAds,
        ':guest'     => $enableGuest,
        ':a_show'    => $showAnnounce,
        ':a_title'   => $announceTitle,
        ':a_body'    => $announceBody,
        ':a_link'    => $announceLink,
        ':contact'   => $contactLine,
        ':privacy'   => $privacyUrl
    ]);

    jsonResponse(true, null, 'Settings updated successfully', 200);

} catch (Throwable $e) {
    // Log error จริงๆ ควรบันทึกลง file log
    jsonResponse(false, null, 'Server error: ' . $e->getMessage(), 500);
}