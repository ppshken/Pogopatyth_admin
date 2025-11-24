<?php
// api/admin/rooms/list.php

// CORS
header("Access-Control-Allow-Origin: http://localhost:5173"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ตรวจสอบ Token
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
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

    // ✅ Pagination + Filters
    $page   = isset($_GET['page'])  ? max(1, intval($_GET['page']))  : 1;
    $limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;

    // ✅ Filters เหมือนเดิม + เพิ่ม search กลางแบบ users/list
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $boss   = isset($_GET['boss'])   ? trim($_GET['boss'])   : '';
    $owner  = isset($_GET['owner'])  ? trim($_GET['owner'])  : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $where = [];
    $params = [];

    if ($status !== '') {
        $where[] = "r.status = ?";
        $params[] = $status;
    }
    if ($boss !== '') {
        $where[] = "r.boss LIKE ?";
        $params[] = "%{$boss}%";
    }
    if ($owner !== '') {
        $where[] = "u.username LIKE ?";
        $params[] = "%{$owner}%";
    }

    // ✅ Search แบบกลาง: boss / owner / id / raid_boss_id
    if ($search !== '') {
        $where[] = "(r.boss LIKE ? OR u.username LIKE ? OR CAST(r.id AS CHAR) LIKE ? OR CAST(r.raid_boss_id AS CHAR) LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }

    $whereSql = $where ? "WHERE " . implode(" AND ", $where) : "";

    // ✅ รายการห้อง (นับสมาชิกแบบ DISTINCT ป้องกันซ้ำ)
    $sql = "SELECT 
                r.id,
                r.raid_boss_id,
                r.boss,
                r.pokemon_image,
                r.start_time, 
                r.status, 
                r.max_members, 
                r.min_level,
                r.vip_only,
                r.lock_room,
                r.password_room,
                r.note, 
                r.avg_rating, 
                r.review_count, 
                r.created_at,
                u.id AS owner_id, 
                u.username AS owner_name,
                u.avatar AS owner_avatar,
                COUNT(DISTINCT ur.user_id) AS member_total
            FROM raid_rooms r
            JOIN users u ON r.owner_id = u.id
            LEFT JOIN user_raid_rooms ur ON r.id = ur.room_id
            $whereSql
            GROUP BY 
                r.id, r.raid_boss_id, r.boss, r.pokemon_image, r.start_time, 
                r.status, r.max_members, r.min_level, r.vip_only, r.lock_room, r.password_room, r.note, r.avg_rating, r.review_count, r.created_at,
                u.id, u.username
            ORDER BY r.created_at DESC
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ นับจำนวนทั้งหมด (ต้องใช้ join users ด้วย เพราะมีเงื่อนไข owner/search)
    $sqlCount = "SELECT COUNT(*)
                 FROM raid_rooms r
                 JOIN users u ON r.owner_id = u.id
                 $whereSql";
    $stmtCount = $pdo->prepare($sqlCount);
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    echo json_encode([
        "success" => true,
        "data" => $rooms,
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
        "error" => $e->getMessage()
    ]);
}
