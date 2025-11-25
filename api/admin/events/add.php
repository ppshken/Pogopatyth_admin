<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ตรวจสอบ Token
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? 
              $_SERVER['HTTP_AUTHORIZATION'] ?? 
              $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]);
    exit;
}
$token = $matches[1];

try {
    $decoded = verify_jwt($token);

    // อนุญาตเฉพาะ admin
    if (!in_array($decoded->role, ['admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    // ✅ รับค่า JSON
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        throw new Exception("ไม่มีข้อมูลส่งมา");
    }

    $title = trim($data['title'] ?? "");
    $description = trim($data['description'] ?? "");
    $image = trim($data['image'] ?? "");
    // สมมติว่าใน JWT Payload มี field ชื่อ id เก็บ user_id ของคน login ไว้
    $created_by = isset($decoded->id) ? intval($decoded->id) : 0; 

    if (!$title || !$description) {
        throw new Exception("กรุณากรอกชื่อกิจกรรมและรายละเอียด");
    }

    // ✅ Insert ข้อมูล
    $stmt = $pdo->prepare("INSERT INTO `events` (`title`, `description`, `image`, `created_by`) 
                           VALUES (:title, :description, :image, :created_by)");

    $stmt->execute([
        ":title" => $title,
        ":description" => $description,
        ":image" => $image,
        ":created_by" => $created_by
    ]);

    echo json_encode([
        "success" => true,
        "message" => "เพิ่มกิจกรรมสำเร็จ",
        "event_id" => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>