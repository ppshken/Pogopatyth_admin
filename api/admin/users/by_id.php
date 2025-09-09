<?php
// api/admin/users/by_id.php

// ------- CORS -------
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ------- Helper: JSON out -------
function json_out($ok, $data = null, $msg = null, $code = 200) {
  http_response_code($code);
  echo json_encode([
    "success" => (bool)$ok,
    "data"    => $data,
    "message" => $msg,
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// ------- รับ Authorization header แบบทนทาน -------
$headers = [];
if (function_exists('getallheaders')) {
  $headers = getallheaders();
} elseif (function_exists('apache_request_headers')) {
  $headers = apache_request_headers();
}
$authHeader =
  ($headers['Authorization'] ?? $headers['authorization'] ?? null) ??
  ($_SERVER['HTTP_AUTHORIZATION'] ?? null) ??
  ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null) ??
  null;

if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $m)) {
  json_out(false, null, "กรุณาใส่ Token", 401);
}
$token = trim($m[1]);

try {
  // กัน clock skew เล็กน้อยตอน verify
  if (class_exists('\Firebase\JWT\JWT')) {
    \Firebase\JWT\JWT::$leeway = 60;
  }
  $decoded = verify_jwt($token);

  // admin เท่านั้น
  if (!in_array(($decoded->role ?? ''), ['admin'], true)) {
    json_out(false, null, "ไม่มีสิทธิ์เข้าถึง", 403);
  }

  // ------- รับ user_id -------
  $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
  if ($userId <= 0) {
    json_out(false, null, "กรุณาส่ง user_id", 400);
  }

  // ------- DB -------
  // รองรับทั้งกรณีมี $pdo (global) หรือมีฟังก์ชัน pdo()
  $pdo = isset($pdo) && $pdo instanceof PDO ? $pdo : (function_exists('pdo') ? pdo() : null);
  if (!$pdo) {
    json_out(false, null, "ไม่สามารถเชื่อมต่อฐานข้อมูลได้", 500);
  }

  // ------- ดึงข้อมูลผู้ใช้หลัก -------
  $sqlUser = "
    SELECT
      id, email, username,
      avatar,
      friend_code, level, status,
      created_at
    FROM users
    WHERE id = :id
    LIMIT 1
  ";
  $stUser = $pdo->prepare($sqlUser);
  $stUser->execute([":id" => $userId]);
  $user = $stUser->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    json_out(false, null, "ไม่พบผู้ใช้", 404);
  }

  // ------- สถิติหลัก -------
  // ห้องที่สร้าง
  $stOwned = $pdo->prepare("SELECT COUNT(*) FROM raid_rooms WHERE owner_id = :uid");
  $stOwned->execute([":uid" => $userId]);
  $roomsOwned = (int)$stOwned->fetchColumn();

  // ห้องที่เข้าร่วม
  $stJoined = $pdo->prepare("SELECT COUNT(*) FROM user_raid_rooms WHERE user_id = :uid");
  $stJoined->execute([":uid" => $userId]);
  $roomsJoined = (int)$stJoined->fetchColumn();

  // รีวิวที่ “เขียน”
  $stRvW = $pdo->prepare("SELECT COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM raid_reviews WHERE user_id = :uid");
  $stRvW->execute([":uid" => $userId]);
  $rowW = $stRvW->fetch(PDO::FETCH_ASSOC) ?: ["cnt" => 0, "avg_rating" => null];
  $reviewsWrittenCount = (int)($rowW["cnt"] ?? 0);
  $reviewsWrittenAvg   = isset($rowW["avg_rating"]) ? (float)$rowW["avg_rating"] : null;

  // รีวิวที่ “ได้รับ” (บนห้องที่ผู้ใช้เป็นเจ้าของ)
  $stRvR = $pdo->prepare("
    SELECT COUNT(*) AS cnt, AVG(rr.rating) AS avg_rating
    FROM raid_reviews rr
    JOIN raid_rooms r ON r.id = rr.room_id
    WHERE r.owner_id = :uid
  ");
  $stRvR->execute([":uid" => $userId]);
  $rowR = $stRvR->fetch(PDO::FETCH_ASSOC) ?: ["cnt" => 0, "avg_rating" => null];
  $reviewsReceivedCount = (int)($rowR["cnt"] ?? 0);
  $reviewsReceivedAvg   = isset($rowR["avg_rating"]) ? (float)$rowR["avg_rating"] : null;

  // ------- รายการรีวิวที่ผู้ใช้นี้เขียน (โชว์ในตาราง/แถบรีวิว) -------
  $stReviews = $pdo->prepare("
    SELECT rr.id, rr.room_id, rr.rating, rr.comment, rr.created_at,
           r.boss AS room_boss
    FROM raid_reviews rr
    LEFT JOIN raid_rooms r ON r.id = rr.room_id
    WHERE rr.user_id = :uid
    ORDER BY rr.created_at DESC
    LIMIT 50
  ");
  $stReviews->execute([":uid" => $userId]);
  $reviews = [];
  while ($rv = $stReviews->fetch(PDO::FETCH_ASSOC)) {
    $reviews[] = [
      "id"         => (int)$rv["id"],
      "room_id"    => isset($rv["room_id"]) ? (int)$rv["room_id"] : null,
      "rating"     => isset($rv["rating"]) ? (float)$rv["rating"] : null,
      "comment"    => $rv["comment"] ?? null,
      "created_at" => $rv["created_at"] ?? null,
      "room_boss"  => $rv["room_boss"] ?? null,
    ];
  }

  // ------- ไทม์ไลน์กิจกรรม (สร้าง/เข้าร่วม/เขียนรีวิว/ได้รับรีวิว) -------
  $activities = [];

  // 1) room_create
  $stCreate = $pdo->prepare("
    SELECT id, boss, created_at
    FROM raid_rooms
    WHERE owner_id = :uid
    ORDER BY created_at DESC
    LIMIT 100
  ");
  $stCreate->execute([":uid" => $userId]);
  while ($r = $stCreate->fetch(PDO::FETCH_ASSOC)) {
    $activities[] = [
      "id"         => (int)$r["id"],
      "type"       => "สร้างห้องบอส",
      "title"      => "สร้างห้อง #".$r["id"],
      "description"=> "บอส ".$r["boss"],
      "created_at" => $r["created_at"] ?? null,
      "meta"       => ["room_id" => (int)$r["id"], "boss" => $r["boss"]],
    ];
  }

  // 2) room_join
  $stJoin = $pdo->prepare("
    SELECT urr.id, urr.room_id, urr.role, urr.joined_at, r.boss
    FROM user_raid_rooms urr
    LEFT JOIN raid_rooms r ON r.id = urr.room_id
    WHERE urr.user_id = :uid
    ORDER BY urr.joined_at DESC
    LIMIT 100
  ");
  $stJoin->execute([":uid" => $userId]);
  while ($j = $stJoin->fetch(PDO::FETCH_ASSOC)) {
    $activities[] = [
      "id"         => (int)$j["id"],
      "type"       => "เข้าร่วมห้องบอส",
      "title"      => "เข้าร่วมห้อง #".$j["room_id"],
      "description"=> "บอส ".($j["boss"] ?? "-")." • บทบาท ".($j["role"] ?? "-"),
      "created_at" => $j["joined_at"] ?? null,
      "meta"       => [
        "room_id" => isset($j["room_id"]) ? (int)$j["room_id"] : null,
        "role"    => $j["role"] ?? null,
        "boss"    => $j["boss"] ?? null
      ],
    ];
  }

  // 3) review_write
  $stRvWList = $pdo->prepare("
    SELECT rr.id, rr.room_id, rr.rating, rr.created_at, r.boss
    FROM raid_reviews rr
    LEFT JOIN raid_rooms r ON r.id = rr.room_id
    WHERE rr.user_id = :uid
    ORDER BY rr.created_at DESC
    LIMIT 100
  ");
  $stRvWList->execute([":uid" => $userId]);
  while ($w = $stRvWList->fetch(PDO::FETCH_ASSOC)) {
    $activities[] = [
      "id"         => (int)$w["id"],
      "type"       => "เขียนรีวิว",
      "title"      => "เขียนรีวิวห้อง #".$w["room_id"],
      "description"=> "บอส ".($w["boss"] ?? "-")." • คะแนน ".(isset($w["rating"]) ? (float)$w["rating"] : null),
      "created_at" => $w["created_at"] ?? null,
      "meta"       => [
        "room_id" => isset($w["room_id"]) ? (int)$w["room_id"] : null,
        "boss"    => $w["boss"] ?? null,
        "rating"  => isset($w["rating"]) ? (float)$w["rating"] : null
      ],
    ];
  }

  // 4) review_received
  $stRvRList = $pdo->prepare("
    SELECT rr.id, rr.room_id, rr.rating, rr.comment, rr.created_at, r.boss
    FROM raid_reviews rr
    JOIN raid_rooms r ON r.id = rr.room_id
    WHERE r.owner_id = :uid
    ORDER BY rr.created_at DESC
    LIMIT 100
  ");
  $stRvRList->execute([":uid" => $userId]);
  while ($rw = $stRvRList->fetch(PDO::FETCH_ASSOC)) {
    $activities[] = [
      "id"         => (int)$rw["id"],
      "type"       => "ได้รับรีวิว",
      "title"      => "ได้รับรีวิวห้อง #".$rw["room_id"],
      "description"=> "บอส ".($rw["boss"] ?? "-")." • คะแนน ".(isset($rw["rating"]) ? (float)$rw["rating"] : null),
      "created_at" => $rw["created_at"] ?? null,
      "meta"       => [
        "room_id" => isset($rw["room_id"]) ? (int)$rw["room_id"] : null,
        "boss"    => $rw["boss"] ?? null,
        "rating"  => isset($rw["rating"]) ? (float)$rw["rating"] : null,
        "comment" => $rw["comment"] ?? null
      ],
    ];
  }

  // ------- จัดเรียงกิจกรรมใหม่ล่าสุดก่อน -------
  usort($activities, function($a, $b) {
    $ta = isset($a["created_at"]) ? strtotime((string)$a["created_at"]) : 0;
    $tb = isset($b["created_at"]) ? strtotime((string)$b["created_at"]) : 0;
    return $tb <=> $ta;
  });

  $lastActiveAt = null;
  if (!empty($activities) && !empty($activities[0]["created_at"])) {
    $lastActiveAt = $activities[0]["created_at"];
  }

  // ------- รวมสถิติ + แปลงดาวจาก 5 -------
  $stats = [
    "rooms_owned"             => $roomsOwned,
    "rooms_joined"            => $roomsJoined,
    "reviews_written_count"   => $reviewsWrittenCount,
    "reviews_written_avg"     => $reviewsWrittenAvg,        // 0-5
    "reviews_received_count"  => $reviewsReceivedCount,
    "reviews_received_avg"    => $reviewsReceivedAvg,       // 0-5
    "reviews_received_stars"  => is_null($reviewsReceivedAvg) ? null : round($reviewsReceivedAvg, 2),
    "last_active_at"          => $lastActiveAt,
  ];

  // ------- ส่งออก -------
  json_out(true, [
    "user"       => [
      "id"          => (int)$user["id"],
      "email"       => $user["email"],
      "username"    => $user["username"],
      "avatar"      => $user["avatar"] ?? null,
      "friend_code" => $user["friend_code"] ?? null,
      "level"       => isset($user["level"]) ? (int)$user["level"] : null,
      "status"      => $user["status"] ?? null,
      "created_at"  => $user["created_at"] ?? null,
    ],
    "stats"      => $stats,
    "reviews"    => $reviews,      // รีวิวที่ผู้ใช้นี้ "เขียน"
    "activities" => $activities,   // รวมกิจกรรมทั้งหมด
  ], "โหลดรายละเอียดผู้ใช้สำเร็จ");

} catch (Throwable $e) {
  // เปิด log เวลา debug จะช่วยบอกสาเหตุ token fail
  error_log("users/by_id error: " . $e->getMessage());
  json_out(false, null, "Token ไม่ถูกต้องหรือหมดอายุ", 401);
}
