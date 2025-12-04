<?php
// api/admin/users/by_id.php

// ------- CORS & Headers -------
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ------- Helper Function -------
function json_out($ok, $data = null, $msg = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => (bool)$ok,
        "data"    => $data,
        "message" => $msg,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ------- Auth & Token Check -------
$headers = [];
if (function_exists('getallheaders')) { $headers = getallheaders(); }
elseif (function_exists('apache_request_headers')) { $headers = apache_request_headers(); }

$authHeader = ($headers['Authorization'] ?? $headers['authorization'] ?? null) ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? null) ?? null;

if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $m)) {
    json_out(false, null, "กรุณาใส่ Token", 401);
}
$token = trim($m[1]);

try {
    // 1. Verify Token
    if (class_exists('\Firebase\JWT\JWT')) { \Firebase\JWT\JWT::$leeway = 60; }
    $decoded = verify_jwt($token);

    // 2. Check Admin Role
    if (!in_array(($decoded->role ?? ''), ['admin'], true)) {
        json_out(false, null, "ไม่มีสิทธิ์เข้าถึง (Admin Only)", 403);
    }

    // 3. Validate Input
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    if ($userId <= 0) {
        json_out(false, null, "กรุณาส่ง user_id", 400);
    }

    // 4. Connect DB
    $pdo = isset($pdo) && $pdo instanceof PDO ? $pdo : (function_exists('pdo') ? pdo() : null);
    if (!$pdo) { json_out(false, null, "DB Connection Error", 500); }

    // ==========================================
    // Part 1: ข้อมูล User Profile
    // ==========================================
    $sqlUser = "
        SELECT 
            id, email, username, avatar, friend_code, team, level,
            device_token, noti_status, setup_status, role, status,
            created_at, google_sub, plan, plan_expires_at, premium_since
        FROM users
        WHERE id = :id LIMIT 1
    ";
    $stUser = $pdo->prepare($sqlUser);
    $stUser->execute([":id" => $userId]);
    $user = $stUser->fetch(PDO::FETCH_ASSOC);

    if (!$user) { json_out(false, null, "ไม่พบผู้ใช้", 404); }

    // ==========================================
    // Part 2: สถิติ & Rating (Host Stats)
    // ==========================================
    
    // 2.1 จำนวนห้องที่สร้าง
    $stOwned = $pdo->prepare("SELECT COUNT(*) FROM raid_rooms WHERE owner_id = :uid");
    $stOwned->execute([":uid" => $userId]);
    $countHosted = (int)$stOwned->fetchColumn();

    // 2.2 คะแนนเฉลี่ย (Rating) ในฐานะ Host
    // คำนวณจาก table raid_reviews ที่ผูกกับห้องที่ user คนนี้เป็นเจ้าของ
    $sqlRating = "
        SELECT 
            COUNT(rr.id) as total_reviews_received,
            AVG(rr.rating) as avg_host_rating
        FROM raid_reviews rr
        JOIN raid_rooms r ON r.id = rr.room_id
        WHERE r.owner_id = :uid
    ";
    $stRating = $pdo->prepare($sqlRating);
    $stRating->execute([":uid" => $userId]);
    $ratingResult = $stRating->fetch(PDO::FETCH_ASSOC);

    $hostRating = $ratingResult['avg_host_rating'] ? round((float)$ratingResult['avg_host_rating'], 2) : 0.0;
    $reviewsReceivedCount = (int)$ratingResult['total_reviews_received'];

    // ==========================================
    // Part 3: ประวัติการรายงาน (Reports)
    // ==========================================
    // 3.1 ถูกคนอื่นรายงาน (As Target)
    $sqlReported = "SELECT * FROM reports WHERE target_id = :uid ORDER BY created_at DESC";
    $stReported = $pdo->prepare($sqlReported);
    $stReported->execute([":uid" => $userId]);
    $reportsReceived = $stReported->fetchAll(PDO::FETCH_ASSOC);

    // 3.2 ไปรายงานคนอื่น (As Reporter)
    $sqlReporter = "SELECT * FROM reports WHERE reporter_id = :uid ORDER BY created_at DESC";
    $stReporter = $pdo->prepare($sqlReporter);
    $stReporter->execute([":uid" => $userId]);
    $reportsWritten = $stReporter->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // Part 4: รีวิว (Reviews)
    // ==========================================
    // 4.1 รีวิวที่ได้รับ (รายละเอียด)
    $sqlRvReceived = "
        SELECT rr.*, r.boss as room_boss, u.username as reviewer_name
        FROM raid_reviews rr
        JOIN raid_rooms r ON r.id = rr.room_id
        LEFT JOIN users u ON u.id = rr.user_id
        WHERE r.owner_id = :uid
        ORDER BY rr.created_at DESC LIMIT 50
    ";
    $stRvReceived = $pdo->prepare($sqlRvReceived);
    $stRvReceived->execute([":uid" => $userId]);
    $listReviewsReceived = $stRvReceived->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // Part 5: Logs รวมมิตร (Timeline)
    // ==========================================
    $timeline = [];

    // 5.1 User Log ✅ (แก้ไข: Join users เพื่อเอา Username จาก Target)
    // ใช้ LEFT JOIN เพราะบาง log type target อาจไม่ใช่ user_id
    $stLog1 = $pdo->prepare("
        SELECT 
            ul.id, ul.type, ul.description, ul.target, ul.created_at,
            u.username as target_username
        FROM user_log ul
        LEFT JOIN users u ON u.id = ul.target
        WHERE ul.user_id = :uid 
        ORDER BY ul.created_at DESC 
        LIMIT 50
    ");
    $stLog1->execute([":uid" => $userId]);
    while($row = $stLog1->fetch(PDO::FETCH_ASSOC)) {
        // ถ้ามี target_username (แปลว่า Join เจอ) ให้ใช้ Username
        // ถ้าไม่เจอ ให้ใช้ค่า target ดิบๆ (เช่น กรณีเป็น string อื่นที่ไม่ใช่ ID)
        $displayTarget = !empty($row['target_username']) ? $row['target_username'] : $row['target'];
        
        $timeline[] = [
            'source' => 'system',
            'action' => $row['type'],
            'detail' => $row['description'],
            'target' => $displayTarget, // ส่งชื่อไปแทน ID
            'time'   => $row['created_at']
        ];
    }

    // 5.2 Raid Log (Join, Create, Invite)
    $stLog2 = $pdo->prepare("SELECT id, type, description, target, room_id, created_at FROM raid_rooms_log WHERE user_id = :uid ORDER BY created_at DESC LIMIT 50");
    $stLog2->execute([":uid" => $userId]);
    while($row = $stLog2->fetch(PDO::FETCH_ASSOC)) {
        $timeline[] = [
            'source' => 'raid',
            'action' => $row['type'], // join, leave, create, invite
            'detail' => $row['description'] . " (Room #" . $row['room_id'] . ")",
            'target' => $row['target'],
            'time'   => $row['created_at']
        ];
    }

    // 5.3 Raid Create History (จากตาราง raid_rooms โดยตรง)
    $stLog3 = $pdo->prepare("SELECT id, boss, created_at FROM raid_rooms WHERE owner_id = :uid ORDER BY created_at DESC LIMIT 50");
    $stLog3->execute([":uid" => $userId]);
    while($row = $stLog3->fetch(PDO::FETCH_ASSOC)) {
        $timeline[] = [
            'source' => 'host',
            'action' => 'create_room',
            'detail' => "สร้างห้องบอส " . $row['boss'],
            'target' => "Room ID: " . $row['id'],
            'time'   => $row['created_at']
        ];
    }

    // เรียงลำดับ Timeline ตามเวลาล่าสุด
    usort($timeline, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    // Part 6: Friends List (NEW)
    $sqlFriends = "
        SELECT 
            u.id, u.username, u.avatar, u.team, u.level, 
            f.created_at as became_friend_at
        FROM friendships f
        JOIN users u ON (
            CASE 
                WHEN f.requester_id = :uid THEN f.addressee_id = u.id
                WHEN f.addressee_id = :uid THEN f.requester_id = u.id
            END
        )
        WHERE (f.requester_id = :uid OR f.addressee_id = :uid)
          AND f.status = 'accepted'
        ORDER BY f.created_at DESC
    ";
    $stFriends = $pdo->prepare($sqlFriends);
    $stFriends->execute([":uid" => $userId]);
    $friendsList = $stFriends->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // Final Output
    // ==========================================
    $response = [
        "profile" => $user,
        "stats" => [
            "host_rating" => $hostRating,           // คะแนนเฉลี่ย 0-5
            "total_hosted" => $countHosted,         // จำนวนห้องที่สร้าง
            "total_reviews_received" => $reviewsReceivedCount, // จำนวนรีวิวที่ได้รับ
            "total_friends" => count($friendsList)
        ],
        "reports" => [
            "received" => $reportsReceived, // โดนใครแจ้งบ้าง
            "written" => $reportsWritten    // ไปแจ้งใครบ้าง
        ],
        "reviews_received" => $listReviewsReceived, // รายการรีวิวที่ได้รับ
        "timeline" => array_slice($timeline, 0, 100), // เอาแค่ 100 รายการล่าสุด
        "friends" => $friendsList
    ];

    json_out(true, $response, "โหลดข้อมูลสำเร็จ");

} catch (Exception $e) {
    json_out(false, null, "Server Error: " . $e->getMessage(), 500);
}
?>