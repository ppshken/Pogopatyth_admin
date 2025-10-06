<?php
// api/admin/raidboss/import_from_url.php

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// Auth (Bearer token)
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader = ($headers['Authorization'] ?? '') ?: ($_SERVER['HTTP_AUTHORIZATION'] ?? '') ?: ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]);
    exit;
}
$token = $matches[1];

try {
    $decoded = verify_jwt($token);
    if (!isset($decoded->role) || !in_array($decoded->role, ['admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $url = trim($data['url'] ?? '');
    $start_date = trim($data['start_date'] ?? '');
    $end_date = trim($data['end_date'] ?? '');
    if (!$url) throw new Exception('กรุณาระบุ url');

    // fetch external JSON
    $opts = ['http' => ['method' => 'GET','header' => "User-Agent: import-script\r\n"]];
    $context = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) throw new Exception('ไม่สามารถดึงข้อมูลจาก URL ได้');

    $arr = json_decode($raw, true);
    if (!is_array($arr)) throw new Exception('ข้อมูลจาก URL ไม่ใช่รูปแบบอาเรย์');

    $inserted = 0;
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO raid_boss (pokemon_id, pokemon_name, pokemon_image, pokemon_tier, start_date, end_date, created_at)
        VALUES (:pokemon_id, :pokemon_name, :pokemon_image, :pokemon_tier, :start_date, :end_date, NOW())");

    foreach ($arr as $item) {
        // Map fields: use name, tier, image
        $name = trim($item['name'] ?? '');
        $tier = $item['tier'] ?? '';
        // extract numeric part of tier (e.g., 'Tier 1' -> 1). default 0
        $tier_num = 0;
        if (is_numeric($tier)) {
            $tier_num = intval($tier);
        } else {
            if (preg_match('/(\d+)/', strval($tier), $tm)) {
                $tier_num = intval($tm[1]);
            }
        }
        $image = $item['image'] ?? '';

        if ($name === '') continue;

        // optional: skip duplicates by name+tier
    $check = $pdo->prepare('SELECT id FROM raid_boss WHERE pokemon_name = ? AND pokemon_tier = ? LIMIT 1');
    $check->execute([$name, $tier_num]);
        if ($check->fetch()) continue;

        // pokemon_id unknown from source -> set 0
        // convert start/end if provided (accept ISO local like "2025-10-06T12:00" or "2025-10-06 12:00:00")
        $sd = $start_date !== '' ? str_replace('T', ' ', $start_date) : null;
        $ed = $end_date !== '' ? str_replace('T', ' ', $end_date) : null;

        $stmt->execute([
            ':pokemon_id' => 0,
            ':pokemon_name' => $name,
            ':pokemon_image' => $image,
            ':pokemon_tier' => $tier_num,
            ':start_date' => $sd,
            ':end_date' => $ed,
        ]);
        $inserted++;
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'นำเข้าข้อมูลสำเร็จ', 'inserted' => $inserted]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
