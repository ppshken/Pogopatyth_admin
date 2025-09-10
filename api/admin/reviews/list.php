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
// api/admin/reviews/list.php

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

    // ✅ Pagination + Filters
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = ($page - 1) * $limit;

    $roomId = $_GET['room_id'] ?? '';
    $userId = $_GET['user_id'] ?? '';
    $rating = $_GET['rating'] ?? '';

    $where = [];
    $params = [];

    if ($roomId) {
        $where[] = "r.room_id = ?";
        $params[] = $roomId;
    }
    if ($userId) {
        $where[] = "r.user_id = ?";
        $params[] = $userId;
    }
    if ($rating) {
        $where[] = "r.rating = ?";
        $params[] = $rating;
    }

    $whereSql = $where ? "WHERE " . implode(" AND ", $where) : "";

    // ✅ ดึงข้อมูลรีวิว
    $sql = "SELECT r.id, r.room_id, r.user_id, r.rating, r.comment, r.created_at,
                   u.username AS reviewer_name, rr.boss AS boss_name
            FROM raid_reviews r
            JOIN users u ON r.user_id = u.id
            JOIN raid_rooms rr ON r.room_id = rr.id
            $whereSql
            ORDER BY r.created_at DESC
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ นับจำนวนทั้งหมด
    $sqlCount = "SELECT COUNT(*) 
                 FROM raid_reviews r
                 JOIN users u ON r.user_id = u.id
                 JOIN raid_rooms rr ON r.room_id = rr.id
                 $whereSql";
    $stmtCount = $pdo->prepare($sqlCount);
    $stmtCount->execute($params);
    $total = $stmtCount->fetchColumn();

    echo json_encode([
        "success" => true,
        "data" => $reviews,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => intval($total),
            "total_pages" => ceil($total / $limit)
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
