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
    $type = trim($data['type'] ?? "");
    $cp_normal_min = isset($data['cp_normal_min']) ? intval($data['cp_normal_min']) : null;
    $cp_normal_max = isset($data['cp_normal_max']) ? intval($data['cp_normal_max']) : null;
    $cp_boost_min = isset($data['cp_boost_min']) ? intval($data['cp_boost_min']) : null;
    $cp_boost_max = isset($data['cp_boost_max']) ? intval($data['cp_boost_max']) : null;
    $special = isset($data['special']) ? boolval($data['special']) : false;
    $maximum = intval($data['maximum'] ?? 0);

    if (!$pokemon_name || !$pokemon_image || !$pokemon_tier || !$start_date || !$end_date) {
        throw new Exception("กรุณากรอก ข้อมูลให้ครบถ้วน");
    }

    // ✅ ตรวจสอบว่า pokemon_id มีอยู่แล้วหรือไม่
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM raid_boss WHERE pokemon_id = :pokemon_id");
    $checkStmt->execute([":pokemon_id" => $pokemon_id]);
    $emailExists = $checkStmt->fetchColumn();

    if ($emailExists > 0) {
        throw new Exception("pokemon_id นี้ ถูกเพิ่มแล้ว");
    }

    $stmt = $pdo->prepare("INSERT INTO `raid_boss`(`pokemon_id`, `pokemon_name`, `pokemon_image`, `pokemon_tier`, `start_date`, `end_date`, `type`, `cp_normal_min`, `cp_normal_max`, `cp_boost_min`, `cp_boost_max`, `special`, `maximum`) 
    VALUES (:pokemon_id, :pokemon_name, :pokemon_image, :pokemon_tier, :start_date, :end_date, :type, :cp_normal_min, :cp_normal_max, :cp_boost_min, :cp_boost_max, :special, :maximum)");

    $stmt->execute([
        ":pokemon_id" => $pokemon_id,
        ":pokemon_name" => $pokemon_name,
        ":pokemon_image" => $pokemon_image,
        ":pokemon_tier" => $pokemon_tier,
        ":start_date" => $start_date,
        ":end_date" => $end_date,
        ":type" => $type,
        ":cp_normal_min" => $cp_normal_min,
        ":cp_normal_max" => $cp_normal_max,
        ":cp_boost_min" => $cp_boost_min,
        ":cp_boost_max" => $cp_boost_max,
        ":special" => $special ? 1 : 0,
        ":maximum" => $maximum,
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
