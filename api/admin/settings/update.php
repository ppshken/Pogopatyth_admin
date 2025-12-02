<?php
// api/admin/settings/update.php

// CORS Setup
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // เปลี่ยนเป็น POST

// กรณี Browser ยิง OPTIONS มาเช็คก่อน
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ 1. ตรวจสอบ Token (Authentication)
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? 
              $_SERVER['HTTP_AUTHORIZATION'] ?? 
              $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาเข้าสู่ระบบ (No Token)"]);
    exit;
}

$token = $matches[1];

try {
    // ✅ 2. ยืนยันความถูกต้องของ Token
    $decoded = verify_jwt($token);

    // เช็คสิทธิ์ Admin (แนะนำเปิดใช้งาน)
    // if ($decoded->role !== 'admin') {
    //     http_response_code(403);
    //     throw new Exception("ไม่มีสิทธิ์แก้ไขการตั้งค่า");
    // }

    // ✅ 3. รับข้อมูล JSON จาก Body
    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE || !$input) {
        http_response_code(400);
        throw new Exception("รูปแบบข้อมูล JSON ไม่ถูกต้อง");
    }

    // ✅ 4. เตรียมข้อมูลสำหรับลง Database (Data Mapping)
    // แปลงค่าจาก Nested JSON ให้เป็นตัวแปรธรรมดา และป้องกันค่า Null

    // Group: Maintenance
    $maintenanceMode    = (int)($input['maintenance']['is_active'] ?? 0);
    $maintenanceMsg     = trim($input['maintenance']['message'] ?? '');

    // Group: Version
    $minAndroid         = trim($input['version_check']['android']['min_version'] ?? '1.0.0');
    $urlAndroid         = trim($input['version_check']['android']['store_url'] ?? '');
    $minIos             = trim($input['version_check']['ios']['min_version'] ?? '1.0.0');
    $urlIos             = trim($input['version_check']['ios']['store_url'] ?? '');

    // Group: Features (vip, feature ตามโครงสร้างใหม่)
    $vip                = (int)($input['features']['vip'] ?? 0);
    $feature            = (int)($input['features']['feature'] ?? 0);

    // Group: Announcement
    $showAnnounce       = (int)($input['announcement']['show'] ?? 0);
    $announceTitle      = trim($input['announcement']['title'] ?? '');
    $announceBody       = trim($input['announcement']['body'] ?? '');
    $announceLink       = trim($input['announcement']['link'] ?? '');

    // Group: General
    $contactLine        = trim($input['general']['contact_line'] ?? '');
    $privacyUrl         = trim($input['general']['privacy_policy'] ?? '');


    // ✅ 5. อัปเดตลง Database (ID = 1 เสมอ)
    $sql = "UPDATE system_configs SET
                maintenance_mode    = :m_mode,
                maintenance_message = :m_msg,
                min_version_android = :v_android,
                store_url_android   = :s_android,
                min_version_ios     = :v_ios,
                store_url_ios       = :s_ios,
                vip                 = :vip,
                feature             = :feature,
                show_announcement   = :a_show,
                announcement_title  = :a_title,
                announcement_body   = :a_body,
                announcement_link   = :a_link,
                contact_line_id     = :contact,
                privacy_policy_url  = :privacy
            WHERE id = 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':m_mode'    => $maintenanceMode,
        ':m_msg'     => $maintenanceMsg,
        ':v_android' => $minAndroid,
        ':s_android' => $urlAndroid,
        ':v_ios'     => $minIos,
        ':s_ios'     => $urlIos,
        ':vip'       => $vip,
        ':feature'   => $feature,
        ':a_show'    => $showAnnounce,
        ':a_title'   => $announceTitle,
        ':a_body'    => $announceBody,
        ':a_link'    => $announceLink,
        ':contact'   => $contactLine,
        ':privacy'   => $privacyUrl
    ]);

    // ✅ 6. ส่ง Response กลับ
    echo json_encode([
        "success" => true,
        "message" => "บันทึกการตั้งค่าเรียบร้อยแล้ว"
    ]);

} catch (Exception $e) {
    // จัดการ Error
    if (http_response_code() == 200) {
        http_response_code(500);
    }
    
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}
?>