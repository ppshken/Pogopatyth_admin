<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

// ถ้าเป็น preflight OPTIONS request → ตอบกลับ 200 เลย
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
// api/admin/rooms/delete.php

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

    // ✅ รับ room_id จาก body
    $input = json_decode(file_get_contents("php://input"), true);
    $roomId = $input['id'] ?? null;

    if (!$roomId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณาระบุ room_id"]);
        exit;
    }

    // ✅ ตรวจสอบว่ามีห้องนี้จริงไหม
    $stmt = $pdo->prepare("SELECT id FROM raid_rooms WHERE id = ?");
    $stmt->execute([$roomId]);
    $room = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$room) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "ไม่พบห้องนี้"]);
        exit;
    }

    // ✅ ลบห้องออกจาก DB
    $stmt = $pdo->prepare("DELETE FROM raid_rooms WHERE id = ?");
    $stmt->execute([$roomId]);

    // ✅ ลบความสัมพันธ์ในตาราง user_raid_rooms ด้วย
    $stmt = $pdo->prepare("DELETE FROM user_raid_rooms WHERE room_id = ?");
    $stmt->execute([$roomId]);

    echo json_encode([
        "success" => true,
        "message" => "ลบห้องเรียบร้อย",
        "data" => [
            "room_id" => $roomId
        ]
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Token ไม่ถูกต้องหรือหมดอายุ",
        "error" => $e->getMessage()
    ]);
}
