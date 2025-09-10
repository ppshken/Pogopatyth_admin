<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// api/admin/dashboard_user_stats.php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ตรวจสอบ Token
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $m)) {
  http_response_code(401);
  echo json_encode(["success"=>false,"message"=>"กรุณาใส่ Token"]); exit;
}

try {
  $decoded = verify_jwt($m[1]);
  if (!in_array($decoded->role ?? '', ['admin'])) {
    http_response_code(403);
    echo json_encode(["success"=>false,"message"=>"ไม่มีสิทธิ์เข้าถึง"]); exit;
  }

  // ---- Params ----
  $start = $_GET['start'] ?? '';   // "YYYY-MM-DD"
  $end   = $_GET['end']   ?? '';   // "YYYY-MM-DD"
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
  if ($limit <= 0 || $limit > 50) $limit = 10;

  // default: 30 วันล่าสุด
  if (!$start || !$end) {
    $end = date('Y-m-d'); // วันนี้
    $start = date('Y-m-d', strtotime('-30 days'));
  }

  $startDt = $start . ' 00:00:00';
  $endDt   = $end   . ' 23:59:59';

  // NOTE: ปรับชื่อตารางสมาชิกให้ตรงกับระบบของคุณ:
  // - ถ้าคุณใช้ `raid_room_members` (room_id, user_id, joined_at) ให้ใช้ตามโค้ดนี้
  // - ถ้าชื่ออื่น (เช่น `room_members`) เปลี่ยนใน SQL ด้านล่างให้ตรง

  // 1) ผู้สร้างห้องมากสุด (ตาม owner_id)
  $sqlCreators = "
    SELECT rr.owner_id AS user_id, u.username,
           COUNT(*) AS rooms_created
    FROM raid_rooms rr
    JOIN users u ON u.id = rr.owner_id
    WHERE rr.created_at BETWEEN :start AND :end
    GROUP BY rr.owner_id
    ORDER BY rooms_created DESC
    LIMIT $limit
  ";
  $st1 = $pdo->prepare($sqlCreators);
  $st1->execute([":start"=>$startDt, ":end"=>$endDt]);
  $top_creators = $st1->fetchAll(PDO::FETCH_ASSOC);

  // 2) ผู้เข้าร่วมห้องมากสุด (นับจากตารางสมาชิก)
  $sqlJoiners = "
    SELECT m.user_id, u.username,
           COUNT(*) AS rooms_joined
    FROM user_raid_rooms m
    JOIN users u ON u.id = m.user_id
    WHERE m.joined_at BETWEEN :start AND :end
    GROUP BY m.user_id
    ORDER BY rooms_joined DESC
    LIMIT $limit
  ";
  $st2 = $pdo->prepare($sqlJoiners);
  $st2->execute([":start"=>$startDt, ":end"=>$endDt]);
  $top_joiners = $st2->fetchAll(PDO::FETCH_ASSOC);

  // 3) โฮสต์ที่ได้คะแนนเฉลี่ยรีวิวสูงสุด (นับรีวิวที่ให้กับห้องของเขา)
  $sqlHostRatings = "
    SELECT rr.owner_id AS user_id, u.username,
           COUNT(r.id) AS reviews, AVG(r.rating) AS avg_rating
    FROM raid_reviews r
    JOIN raid_rooms rr ON rr.id = r.room_id
    JOIN users u ON u.id = rr.owner_id
    WHERE r.created_at BETWEEN :start AND :end
    GROUP BY rr.owner_id
    HAVING reviews >= 3
    ORDER BY avg_rating DESC, reviews DESC
    LIMIT $limit
  ";
  $st3 = $pdo->prepare($sqlHostRatings);
  $st3->execute([":start"=>$startDt, ":end"=>$endDt]);
  $top_host_ratings = $st3->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode([
    "success" => true,
    "data" => [
      "range" => ["start"=>$start, "end"=>$end],
      "top_creators" => array_map(fn($r)=>[
        "user_id" => (int)$r["user_id"],
        "username"=> $r["username"],
        "rooms_created" => (int)$r["rooms_created"]
      ], $top_creators),
      "top_joiners" => array_map(fn($r)=>[
        "user_id" => (int)$r["user_id"],
        "username"=> $r["username"],
        "rooms_joined" => (int)$r["rooms_joined"]
      ], $top_joiners),
      "top_host_ratings" => array_map(fn($r)=>[
        "user_id" => (int)$r["user_id"],
        "username"=> $r["username"],
        "reviews" => (int)$r["reviews"],
        "avg_rating" => round((float)$r["avg_rating"], 2)
      ], $top_host_ratings),
    ]
  ]);

} catch (Exception $e) {
  http_response_code(401);
  echo json_encode([
    "success"=>false,
    "message"=>"Token ไม่ถูกต้องหรือหมดอายุ",
    "error"=>$e->getMessage()
  ]);
}
