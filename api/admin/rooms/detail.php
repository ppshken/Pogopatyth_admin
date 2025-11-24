<?php
// api/admin/rooms/detail.php

// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

    // ✅ รับ room id
    $roomId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($roomId <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "รหัสห้องไม่ถูกต้อง"]);
        exit;
    }

    // ✅ ดึงข้อมูลห้อง (join owner)
    $sqlRoom = "SELECT
                    r.id,
                    r.raid_boss_id,
                    r.pokemon_image,
                    r.boss,
                    r.start_time,
                    r.max_members,
                    r.min_level,
                    r.vip_only,
                    r.lock_room,
                    r.password_room,
                    r.status,
                    r.owner_id,
                    r.note,
                    r.avg_rating,
                    r.review_count,
                    r.created_at,
                    u.username AS owner_name,
                    u.avatar   AS owner_avatar
                FROM raid_rooms r
                JOIN users u ON r.owner_id = u.id
                WHERE r.id = ?
                LIMIT 1";
    $stmtRoom = $pdo->prepare($sqlRoom);
    $stmtRoom->execute([$roomId]);
    $room = $stmtRoom->fetch(PDO::FETCH_ASSOC);

    if (!$room) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "ไม่พบห้อง"]);
        exit;
    }

    // ✅ รายชื่อผู้เข้าร่วม
    $sqlMembers = "SELECT
                      ur.id,
                      ur.room_id,
                      ur.user_id,
                      ur.role,
                      ur.joined_at,
                      ur.friend_ready,
                      ur.friend_ready_at,
                      u.username,
                      u.avatar
                   FROM user_raid_rooms ur
                   JOIN users u ON ur.user_id = u.id
                   WHERE ur.room_id = ?
                   ORDER BY ur.joined_at ASC, ur.id ASC";
    $stmtMembers = $pdo->prepare($sqlMembers);
    $stmtMembers->execute([$roomId]);
    $members = $stmtMembers->fetchAll(PDO::FETCH_ASSOC);

    // ✅ จำนวนสมาชิก (DISTINCT กันซ้ำ)
    $stmtCount = $pdo->prepare("SELECT COUNT(DISTINCT ur.user_id) FROM user_raid_rooms ur WHERE ur.room_id = ?");
    $stmtCount->execute([$roomId]);
    $member_total = (int)$stmtCount->fetchColumn();

    // ✅ รายการรีวิวของห้อง (ล่าสุดมาก่อน)
    $sqlReviews = "SELECT
                      rr.id,
                      rr.room_id,
                      rr.user_id,
                      rr.rating,
                      rr.comment,
                      rr.created_at,
                      rr.updated_at,
                      u.username,
                      u.avatar
                   FROM raid_reviews rr
                   JOIN users u ON rr.user_id = u.id
                   WHERE rr.room_id = ?
                   ORDER BY rr.created_at DESC, rr.id DESC";
    $stmtReviews = $pdo->prepare($sqlReviews);
    $stmtReviews->execute([$roomId]);
    $reviews = $stmtReviews->fetchAll(PDO::FETCH_ASSOC);

    // ✅ ดึง raid_rooms_log
    $sqlLogs = "SELECT
                    rrl.id,
                    rrl.room_id,
                    rrl.user_id,
                    rrl.type,
                    rrl.target,
                    rrl.description,
                    rrl.created_at,
                    u.username
                FROM raid_rooms_log rrl
                LEFT JOIN users u ON rrl.user_id = u.id
                WHERE rrl.room_id = ?
                ORDER BY rrl.created_at DESC";
    $stmtLogs = $pdo->prepare($sqlLogs);
    $stmtLogs->execute([$roomId]);
    $logs = $stmtLogs->fetchAll(PDO::FETCH_ASSOC);

    // ✅ ดึง chat
    $sqlChat = "SELECT
                    c.id,
                    c.raid_rooms_id,
                    c.sender,
                    c.message,
                    c.created_at,
                    u.username,
                    u.avatar
                FROM chat c
                LEFT JOIN users u ON c.sender = u.id
                WHERE c.raid_rooms_id = ?
                ORDER BY c.created_at ASC";
    $stmtChat = $pdo->prepare($sqlChat);
    $stmtChat->execute([$roomId]);
    $chat = $stmtChat->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => [
            "room" => $room,
            "members" => $members,
            "member_total" => $member_total,
            "reviews" => $reviews,
            "logs" => $logs,
            "chat" => $chat,
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
