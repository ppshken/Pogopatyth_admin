<?php
// CORS Setup
header("Access-Control-Allow-Origin: *"); // แนะนำให้ระบุ Domain จริงเมื่อขึ้น Production
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

    // เช็คสิทธิ์ Admin (ถ้าต้องการจำกัดสิทธิ์)
    // if (!in_array($decoded->role, ['admin'])) {
    //     http_response_code(403);
    //     throw new Exception("ไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
    // }

    // ✅ 3. รับค่า ID จาก URL Query String (?id=1)
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($id <= 0) {
        http_response_code(400);
        throw new Exception("ID กิจกรรมไม่ถูกต้อง");
    }

    // ✅ 4. ดึงข้อมูลจาก Database
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(404);
        throw new Exception("ไม่พบข้อมูลกิจกรรม ID: " . $id);
    }

    // ✅ 5. ส่งข้อมูลกลับเป็น JSON
    echo json_encode([
        "success" => true,
        "data" => $event
    ]);

} catch (Exception $e) {
    // กรณีเกิด Error ให้ส่ง Code ตามความเหมาะสม (400, 401, 404, 500)
    // แต่ในที่นี้ default เป็น 400 หรือ 500 ถ้า code ยังไม่ได้ set
    if (http_response_code() == 200) {
        http_response_code(400);
    }
    
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}
?>