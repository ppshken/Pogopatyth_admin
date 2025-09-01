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
// api/admin/dashboard.php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/jwt.php";

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

    // ✅ Users
    $totalUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE role <> 'admin'")->fetchColumn();
    $newUsersToday = $pdo->query("SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()")->fetchColumn();

    // ✅ Rooms
    $totalRooms = $pdo->query("SELECT COUNT(*) FROM raid_rooms")->fetchColumn();
    $roomsToday = $pdo->query("SELECT COUNT(*) FROM raid_rooms WHERE DATE(created_at) = CURDATE()")->fetchColumn();

    // ✅ Reports
    $pendingReports = $pdo->query("SELECT COUNT(*) FROM reports WHERE status = 'pending'")->fetchColumn();

    // ✅ Reviews
    $totalReviews = $pdo->query("SELECT COUNT(*) FROM raid_reviews")->fetchColumn();

    // ✅ Notifications
    $totalNotifs = $pdo->query("SELECT COUNT(*) FROM notifications")->fetchColumn();

    // ✅ Boss ที่นิยมมากสุด (วันนี้)
    $stmt = $pdo->query("
        SELECT pokemon_name, COUNT(*) as count
        FROM raid_rooms
        WHERE DATE(created_at) = CURDATE()
        GROUP BY pokemon_name
        ORDER BY count DESC
        LIMIT 1
    ");
    $topBoss = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => [
            "users" => [
                "total" => intval($totalUsers),
                "new_today" => intval($newUsersToday)
            ],
            "rooms" => [
                "total" => intval($totalRooms),
                "created_today" => intval($roomsToday)
            ],
            "reports" => [
                "pending" => intval($pendingReports)
            ],
            "reviews" => [
                "total" => intval($totalReviews)
            ],
            "notifications" => [
                "total" => intval($totalNotifs)
            ],
            "top_boss_today" => $topBoss['boss'] ?? null
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
