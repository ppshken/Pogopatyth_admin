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

    $pokemon_id = intval($data['pokemon_id'] ?? 0);
    $pokemon_name = trim($data['pokemon_name'] ?? "");
    $pokemon_image = trim($data['pokemon_image'] ?? "");
    $pokemon_tier = intval($data['pokemon_tier'] ?? 0);
    $start_date = trim($data['start_date'] ?? "");
    $end_date = trim($data['end_date'] ?? "");

    if (!$pokemon_id || !$pokemon_name || !$pokemon_image || !$pokemon_tier || !$start_date || !$end_date) {
        throw new Exception("กรอก email, username และ password");
    }

    // ✅ ตรวจสอบว่า pokemon_id มีอยู่แล้วหรือไม่
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM raid_boss WHERE pokemon_id = :pokemon_id");
    $checkStmt->execute([":pokemon_id" => $pokemon_id]);
    $emailExists = $checkStmt->fetchColumn();

    if ($emailExists > 0) {
        throw new Exception("pokemon_id นี้ ถูกเพิ่มแล้ว");
    }

    $stmt = $pdo->prepare("INSERT INTO `raid_boss`(`pokemon_id`, `pokemon_name`, `pokemon_image`, `pokemon_tier`, `start_date`, `end_date`) 
    VALUES (:pokemon_id, :pokemon_name, :pokemon_image, :pokemon_tier, :start_date, :end_date)");

    $stmt->execute([
        ":pokemon_id" => $pokemon_id,
        ":pokemon_name" => $pokemon_name,
        ":pokemon_image" => $pokemon_image,
        ":pokemon_tier" => $pokemon_tier,
        ":start_date" => $start_date,
        ":end_date" => $end_date,
    ]);

    echo json_encode([
        "success" => true,
        "message" => "เพิ่มบอสสำเร็จ",
        "raid_boss_id" => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
