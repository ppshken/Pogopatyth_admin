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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['room_id'], $data['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$room_id = intval($data['room_id']);
$user_id = intval($data['user_id']);


$stmt = $pdo->prepare('DELETE FROM user_raid_rooms WHERE room_id = ? AND user_id = ?');
if ($stmt->execute([$room_id, $user_id])) {
    echo json_encode(['success' => true, 'message' => 'เตะสมาชิกออกจากห้องเรียบร้อยแล้ว']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to kick member']);
}