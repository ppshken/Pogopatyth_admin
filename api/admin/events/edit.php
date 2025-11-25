<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS"); // รองรับทั้ง PUT และ POST แล้วแต่ Front-end สะดวก
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

    $id = intval($data['id'] ?? 0);
    $title = trim($data['title'] ?? "");
    $description = trim($data['description'] ?? "");
    $image = trim($data['image'] ?? "");

    if (!$id || !$title) {
        throw new Exception("กรุณาระบุ ID และชื่อกิจกรรม");
    }

    // ✅ ตรวจสอบว่ามี ID นี้จริงไหม
    $checkStmt = $pdo->prepare("SELECT id FROM events WHERE id = :id");
    $checkStmt->execute([":id" => $id]);
    if ($checkStmt->rowCount() === 0) {
        throw new Exception("ไม่พบกิจกรรมที่ต้องการแก้ไข");
    }

    // ✅ Update ข้อมูล
    $stmt = $pdo->prepare("UPDATE `events` 
                           SET `title` = :title, 
                               `description` = :description, 
                               `image` = :image 
                           WHERE `id` = :id");

    $stmt->execute([
        ":title" => $title,
        ":description" => $description,
        ":image" => $image,
        ":id" => $id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "แก้ไขกิจกรรมสำเร็จ"
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>