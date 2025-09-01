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
// api/admin/login.php

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/jwt.php";

// รับข้อมูลจาก client
$input = json_decode(file_get_contents("php://input"), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "กรุณากรอกข้อมูลให้ครบ"]);
    exit;
}

try {
    // ดึงข้อมูล user
    $stmt = $pdo->prepare("SELECT id, email, username, password_hash, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "ไม่พบผู้ใช้นี้"]);
        exit;
    }

    // ตรวจสอบ password
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "รหัสผ่านไม่ถูกต้อง"]);
        exit;
    }

    // ตรวจสอบ role ว่าเป็น admin หรือ moderator เท่านั้น
    if (!in_array($user['role'], ['admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง Admin Panel"]);
        exit;
    }

    // สร้าง JWT Token
    $token = generate_jwt([
        "id" => $user['id'],
        "email" => $user['email'],
        "role" => $user['role']
    ]);

    echo json_encode([
        "success" => true,
        "message" => "เข้าสู่ระบบสำเร็จ",
        "data" => [
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "email" => $user['email'],
                "username" => $user['username'],
                "role" => $user['role']
            ]
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
