<?php
// api/admin/raidboss/list.php

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
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader =
    ($headers['Authorization'] ?? '') ?:
    ($_SERVER['HTTP_AUTHORIZATION'] ?? '') ?:
    ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');

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

    // ✅ Pagination
    $page   = isset($_GET['page'])  ? max(1, intval($_GET['page']))  : 1;
    $limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;

    // ✅ Search & Filters (optional: tier)
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $tier   = isset($_GET['tier'])   ? trim($_GET['tier'])   : '';

    $whereSql = "WHERE 1=1";
    $params   = [];

    if ($search !== '') {
        // ค้นหาจากชื่อ หรือ pokemon_id (cast เป็น CHAR เพื่อใช้ LIKE ได้)
        $whereSql .= " AND (pokemon_name LIKE ? OR CAST(pokemon_id AS CHAR) LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }

    if ($tier !== '') {
        $whereSql .= " AND pokemon_tier = ?";
        $params[]  = $tier;
    }

    // ✅ ดึงรายการ
    $sql = "SELECT
                id,
                pokemon_id,
                pokemon_name,
                pokemon_image,
                pokemon_tier,
                start_date,
                end_date,
                created_at
            FROM raid_boss
            $whereSql
            ORDER BY start_date DESC, created_at DESC
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ นับจำนวนทั้งหมด
    $sqlCount = "SELECT COUNT(*) FROM raid_boss $whereSql";
    $stmtCount = $pdo->prepare($sqlCount);
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    echo json_encode([
        "success" => true,
        "data" => $rows,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => $total,
            "total_pages" => max(1, (int)ceil($total / $limit))
        ]
    ]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Token ไม่ถูกต้องหรือหมดอายุ",
        "error"   => $e->getMessage()
    ]);
}
