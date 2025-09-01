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
// api/admin/notifications/create.php

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

    // ✅ รับข้อมูลจาก body
    $input = json_decode(file_get_contents("php://input"), true);
    $title = trim($input['title'] ?? '');
    $message = trim($input['message'] ?? '');
    $target = $input['target'] ?? 'all'; // all / user:{id} / room:{id}

    if (!$title || !$message) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณากรอก title และ message"]);
        exit;
    }

    // ✅ บันทึกลง DB
    $stmt = $pdo->prepare("INSERT INTO notifications (title, message, target, sent_by) VALUES (?, ?, ?, ?)");
    $stmt->execute([$title, $message, $target, $decoded->id]);

    $notifId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true,
        "message" => "สร้างประกาศใหม่เรียบร้อย",
        "data" => [
            "id" => $notifId,
            "title" => $title,
            "message" => $message,
            "target" => $target,
            "sent_by" => $decoded->id
        ]
    ]);

    // ✅ TODO: ถ้าต้องการ push notification ไปที่ device จริง
    // ตรงนี้สามารถเชื่อม Firebase Cloud Messaging (FCM) หรือ LINE Notify ได้
    // ตอนนี้เก็บแค่ใน DB ก่อน

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Token ไม่ถูกต้องหรือหมดอายุ",
        "error" => $e->getMessage()
    ]);
}
