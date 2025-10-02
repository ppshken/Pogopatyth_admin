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

    // ✅ รับ notifications_id จาก body
    $input = json_decode(file_get_contents("php://input"), true);
    $notiId = $input['id'] ?? null;

    if (!$notiId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณาระบุ notifications_id"]);
        exit;
    }

    // ✅ ตรวจสอบว่ามีการแจ้งเตือนนี้จริงไหม
    $stmt = $pdo->prepare("SELECT id FROM notifications WHERE id = ?");
    $stmt->execute([$notiId]);
    $room = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$room) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "ไม่พบการแจ้งเตือนนี้"]);
        exit;
    }

    // ✅ ลบการแจ้งเตือน
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
    $stmt->execute([$notiId]);

    echo json_encode([
        "success" => true,
        "message" => "ลบการแจ้งเตือนเรียบร้อย",
        "data" => [
            "notifications_id" => $notiId
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
