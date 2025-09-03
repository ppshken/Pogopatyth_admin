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
// api/admin/users/update.php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ตรวจสอบ token
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]);
    exit;
}
$token = $matches[1];

try {
    $decoded = verify_jwt($token);
    if ($decoded->role !== "admin") {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    // รับค่า JSON
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || !isset($input["id"])) {
        throw new Exception("ข้อมูลไม่ครบ");
    }

    $id         = intval($input["id"]);
    $email      = trim($input["email"] ?? "");
    $username   = trim($input["username"] ?? "");
    $password   = $input["password"] ?? null;
    $friendCode = trim($input["friend_code"] ?? "");
    $level      = intval($input["level"] ?? 0);
    $status   = trim($input["status"] ?? "");

    if (!$email || !$username) {
        throw new Exception("กรุณากรอก email และ username");
    }

    // build query
    $sql = "UPDATE users 
            SET email = :email, username = :username, friend_code = :friend_code, level = :level, status = :status";
    $params = [
        ":email"       => $email,
        ":username"    => $username,
        ":friend_code" => $friendCode,
        ":level"       => $level,
        ":id"          => $id,
        ":status"      => $status,
    ];

    if (!empty($password)) {
        $sql .= ", password_hash = :password";
        $params[":password"] = password_hash($password, PASSWORD_BCRYPT);
    }

    $sql .= " WHERE id = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        "success" => true,
        "message" => "อัปเดตผู้ใช้เรียบร้อย"
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}