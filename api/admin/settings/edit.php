<?php
// api/admin/settings/edit.php

// CORS Setup
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

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

    // เช็คสิทธิ์ Admin (แนะนำให้เปิดใช้งานสำหรับหน้า Settings)
    // if ($decoded->role !== 'admin') {
    //     http_response_code(403);
    //     throw new Exception("ไม่มีสิทธิ์เข้าถึงส่วนตั้งค่าระบบ");
    // }

    // ✅ 3. ดึงข้อมูลจาก Database (ดึงแถวแรก ID=1 เสมอ)
    $stmt = $pdo->prepare("SELECT * FROM system_configs WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $config = $stmt->fetch(PDO::FETCH_ASSOC);

    // กรณีตารางยังว่างอยู่ (ยังไม่เคย Insert) ให้เตรียม Array ว่างไว้กัน Error
    if (!$config) {
        $config = [];
    }

    // ✅ 4. จัด Format ข้อมูล (Mapping DB Columns -> Nested JSON)
    // ต้องแปลงโครงสร้างให้ตรงกับที่หน้าบ้าน (React) ใช้งาน
    $formattedData = [
        'maintenance' => [
            'is_active' => (bool)($config['maintenance_mode'] ?? 0),
            'message'   => $config['maintenance_message'] ?? ''
        ],
        'version_check' => [
            'android' => [
                'min_version' => $config['min_version_android'] ?? '',
                'store_url'   => $config['store_url_android'] ?? ''
            ],
            'ios' => [
                'min_version' => $config['min_version_ios'] ?? '',
                'store_url'   => $config['store_url_ios'] ?? ''
            ]
        ],
        'features' => [
            'vip'         => (bool)($config['vip'] ?? 0),
            'feature' => (bool)($config['feature'] ?? 0),
        ],
        'announcement' => [
            'show'  => (bool)($config['show_announcement'] ?? 0),
            'title' => $config['announcement_title'] ?? '',
            'body'  => $config['announcement_body'] ?? '',
            'link'  => $config['announcement_link'] ?? ''
        ],
        'general' => [
            'contact_line'   => $config['contact_line_id'] ?? '',
            'privacy_policy' => $config['privacy_policy_url'] ?? ''
        ]
    ];

    // ✅ 5. ส่งข้อมูลกลับเป็น JSON
    echo json_encode([
        "success" => true,
        "data" => $formattedData
    ]);

} catch (Exception $e) {
    // จัดการ Error ตามสไตล์เดิม
    if (http_response_code() == 200) {
        http_response_code(500); // หรือ 400 แล้วแต่กรณี
    }
    
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}
?>