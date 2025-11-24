<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

    $email = trim($data['email'] ?? "");
    $username = trim($data['username'] ?? "");
    $password = $data['password'] ?? "";
    $friend_code = trim($data['friend_code'] ?? "");
    $level = intval($data['level'] ?? 1);
    $team = $data['team'] ?? "Valor";
    $device_token = trim($data['device_token'] ?? "");
    $role = $data['role'] ?? "member";
    $status = $data['status'] ?? "active";

    if (!$email || !$username || !$password) {
        throw new Exception("กรอก email, username และ password");
    }

    // ✅ ตรวจสอบว่า email มีอยู่แล้วหรือไม่
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
    $checkStmt->execute([":email" => $email]);
    $emailExists = $checkStmt->fetchColumn();

    if ($emailExists > 0) {
        throw new Exception("อีเมลนี้ถูกใช้งานแล้ว");
    }

    // ✅ Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // ✅ Insert
    $stmt = $pdo->prepare("INSERT INTO users 
        (email, username, password_hash, friend_code, level, team, device_token, role, status, created_at) 
        VALUES (:email, :username, :password_hash, :friend_code, :level, :team, :device_token, :role, :status, NOW())");

    $stmt->execute([
        ":email" => $email,
        ":username" => $username,
        ":password_hash" => $password_hash,
        ":friend_code" => $friend_code,
        ":level" => $level,
        ":team" => $team,
        ":device_token" => $device_token,
        ":role" => $role,
        ":status" => $status,
    ]);

    echo json_encode([
        "success" => true,
        "message" => "เพิ่มผู้ใช้สำเร็จ",
        "user_id" => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
