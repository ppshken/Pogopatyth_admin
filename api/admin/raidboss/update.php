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
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader = $headers['Authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]);
    exit;
}
$token = $matches[1];

try {
    $decoded = verify_jwt($token);
    if (!isset($decoded->role) || $decoded->role !== "admin") {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    // รับค่า JSON
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || !isset($input["id"])) {
        throw new Exception("ข้อมูลไม่ครบ");
    }

    $id             = intval($input["id"]);
    $pokemon_id     = intval($input["pokemon_id"] ?? 0);
    $pokemon_name   = trim($input["pokemon_name"] ?? "");
    $pokemon_image  = trim($input["pokemon_image"] ?? "");
    $pokemon_tier   = intval($input["pokemon_tier"] ?? 0);
    $start_date     = trim($input["start_date"] ?? "");
    $end_date       = trim($input["end_date"] ?? "");
    $type           = trim($input["type"] ?? "");
    $cp_normal_min  = isset($input["cp_normal_min"]) ? intval($input["cp_normal_min"]) : null;
    $cp_normal_max  = isset($input["cp_normal_max"]) ? intval($input["cp_normal_max"]) : null;
    $cp_boost_min   = isset($input["cp_boost_min"])  ? intval($input["cp_boost_min"])  : null;
    $cp_boost_max   = isset($input["cp_boost_max"])  ? intval($input["cp_boost_max"])  : null;
    $special        = isset($input["special"]) ? boolval($input["special"]) : false;


    if (!$id || !$pokemon_name || !$pokemon_image || !$pokemon_tier || !$start_date  || !$end_date) {
        throw new Exception("กรุณากรอก ข้อมูลให้ครบถ้วน");
    }

    // build query
    $sql = "UPDATE raid_boss 
            SET pokemon_id = :pokemon_id,
                pokemon_name = :pokemon_name,
                pokemon_image = :pokemon_image,
                pokemon_tier = :pokemon_tier,
                start_date = :start_date,
                end_date = :end_date,
                type = :type,
                cp_normal_min = :cp_normal_min,
                cp_normal_max = :cp_normal_max,
                cp_boost_min = :cp_boost_min,
                cp_boost_max = :cp_boost_max,
                special = :special
            WHERE id = :id";

    $params = [
        ":id"            => $id,
        ":pokemon_id"    => $pokemon_id,
        ":pokemon_name"  => $pokemon_name,
        ":pokemon_image" => $pokemon_image,
        ":pokemon_tier"  => $pokemon_tier,
        ":start_date"    => $start_date,
        ":end_date"      => $end_date,
        ":type"          => $type,
        ":cp_normal_min" => $cp_normal_min,
        ":cp_normal_max" => $cp_normal_max,
        ":cp_boost_min"  => $cp_boost_min,
        ":cp_boost_max"  => $cp_boost_max,
        ":special"       => $special ? 1 : 0,
    ];

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        "success" => true,
        "message" => "อัปเดตบอสเรียบร้อย"
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
