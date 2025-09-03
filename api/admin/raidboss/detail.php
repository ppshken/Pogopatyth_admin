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
// api/admin/users/by_id.php

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ตรวจสอบ Authorization
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

    // ✅ admin เท่านั้น
    if (!in_array($decoded->role, ['admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    $raid_boss_id = $_GET['raid_boss_id'] ?? null;
    if (!$raid_boss_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณาส่ง raid_boss_id"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, pokemon_id, pokemon_name, pokemon_image, pokemon_tier, start_date, end_date, created_at FROM raid_boss WHERE id = :id");
    $stmt->execute([":id" => $raid_boss_id]);
    $raidboss = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$raidboss) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "ไม่พบบอส"]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "data" => $raidboss
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Token ไม่ถูกต้องหรือหมดอายุ",
        "error" => $e->getMessage()
    ]);
}
