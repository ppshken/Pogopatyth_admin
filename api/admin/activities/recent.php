<?php
// api/admin/activities/recent.php

// ------- CORS (ปรับ origin ตามสภาพจริงได้) -------
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ------- Helper -------
function json_out($ok, $data=null, $msg='ok', $code=200) {
  http_response_code($code);
  echo json_encode(['success'=>$ok, 'data'=>$data, 'message'=>$msg], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  // ------- Auth: Admin เท่านั้น -------
  $headers = function_exists('getallheaders') ? getallheaders() : (function_exists('apache_request_headers') ? apache_request_headers() : []);
  $authHeader = ($headers['Authorization'] ?? $headers['authorization'] ?? null)
    ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? null)
    ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
  if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $m)) {
    json_out(false, null, 'กรุณาใส่ Token', 401);
  }
  if (class_exists('\Firebase\JWT\JWT')) { \Firebase\JWT\JWT::$leeway = 60; }
  $decoded = verify_jwt(trim($m[1]));
  if (!in_array(($decoded->role ?? ''), ['admin'], true)) {
    json_out(false, null, 'ไม่มีสิทธิ์เข้าถึง', 403);
  }

  // ------- DB -------
  $pdo = isset($pdo) && $pdo instanceof PDO ? $pdo : (function_exists('pdo') ? pdo() : null);
  if (!$pdo) json_out(false, null, 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 500);

  // ------- Limit (ค่าเริ่มต้น 10, สูงสุด 50) -------
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
  if ($limit <= 0) $limit = 10;
  if ($limit > 50) $limit = 50;

  // ตรวจว่ามีตารางเสริมไหม (เช่น room_messages, user_friends)
  $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
  $hasMessages = in_array('room_messages', $tables, true);
  $hasFriends  = in_array('user_friends',  $tables, true);

  // ------- รวมกิจกรรมด้วย UNION ALL (เลือกคอลัมน์มาตรฐาน) -------
  $parts = [];

  // สร้างห้องบอส (owner คือผู้กระทำ)
  $parts[] = "
    SELECT
      'สร้างห้องบอส' AS event_type,
      r.id          AS id,
      r.created_at  AS ts,
      r.id          AS room_id,
      r.boss        AS boss,
      r.owner_id    AS actor_user_id,
      u.username    AS actor_name,
      NULL          AS target_user_id,
      NULL          AS target_name,
      NULL          AS rating,
      NULL          AS comment
    FROM raid_rooms r
    LEFT JOIN users u ON u.id = r.owner_id
  ";

  // เข้าร่วมห้องบอส (ผู้เข้าร่วม คือผู้กระทำ, owner เป็น target)
  $parts[] = "
    SELECT
      'เข้าร่วมห้องบอส' AS event_type,
      urr.id        AS id,
      urr.joined_at AS ts,
      urr.room_id   AS room_id,
      r.boss        AS boss,
      urr.user_id   AS actor_user_id,
      u.username    AS actor_name,
      r.owner_id    AS target_user_id,
      uo.username   AS target_name,
      NULL          AS rating,
      NULL          AS comment
    FROM user_raid_rooms urr
    LEFT JOIN raid_rooms r ON r.id = urr.room_id
    LEFT JOIN users u  ON u.id  = urr.user_id
    LEFT JOIN users uo ON uo.id = r.owner_id
  ";

  // เขียนรีวิว (ผู้รีวิว คือผู้กระทำ, owner เป็น target)
  $parts[] = "
    SELECT
      'เขียนรีวิว'  AS event_type,
      rr.id          AS id,
      rr.created_at  AS ts,
      rr.room_id     AS room_id,
      r.boss         AS boss,
      rr.user_id     AS actor_user_id,
      u.username     AS actor_name,
      r.owner_id     AS target_user_id,
      uo.username    AS target_name,
      rr.rating      AS rating,
      rr.comment     AS comment
    FROM raid_reviews rr
    LEFT JOIN raid_rooms r ON r.id = rr.room_id
    LEFT JOIN users u  ON u.id  = rr.user_id
    LEFT JOIN users uo ON uo.id = r.owner_id
  ";

  // ได้รับรีวิว (ไม่นับเจ้าของรีวิวตัวเอง)
  $parts[] = "
    SELECT
      'ได้รับรีวิว'  AS event_type,
      rr.id          AS id,
      rr.created_at  AS ts,
      rr.room_id     AS room_id,
      r.boss         AS boss,
      rr.user_id     AS actor_user_id,
      u.username     AS actor_name,
      r.owner_id     AS target_user_id,
      uo.username    AS target_name,
      rr.rating      AS rating,
      rr.comment     AS comment
    FROM raid_reviews rr
    JOIN raid_rooms r ON r.id = rr.room_id
    LEFT JOIN users u  ON u.id  = rr.user_id
    LEFT JOIN users uo ON uo.id = r.owner_id
    WHERE rr.user_id <> r.owner_id
  ";

  // ส่งแชท (มีตารางค่อยรวม)
  if ($hasMessages) {
    $parts[] = "
      SELECT
        'ส่งแชท'      AS event_type,
        m.id           AS id,
        m.created_at   AS ts,
        m.room_id      AS room_id,
        r.boss         AS boss,
        m.sender_id    AS actor_user_id,
        u.username     AS actor_name,
        NULL           AS target_user_id,
        NULL           AS target_name,
        NULL           AS rating,
        m.message      AS comment
      FROM room_messages m
      LEFT JOIN raid_rooms r ON r.id = m.room_id
      LEFT JOIN users u ON u.id = m.sender_id
    ";
  }

  // เพิ่มเพื่อน (มีตารางค่อยรวม) — ปรับชื่อตาราง/คอลัมน์ตามจริงได้
  if ($hasFriends) {
    $parts[] = "
      SELECT
        'เพิ่มเพื่อน'  AS event_type,
        f.id            AS id,
        f.created_at    AS ts,
        NULL            AS room_id,
        NULL            AS boss,
        f.user_id       AS actor_user_id,
        ua.username     AS actor_name,
        f.friend_id     AS target_user_id,
        uf.username     AS target_name,
        NULL            AS rating,
        NULL            AS comment
      FROM user_friends f
      LEFT JOIN users ua ON ua.id = f.user_id
      LEFT JOIN users uf ON uf.id = f.friend_id
    ";
  }

  // สร้าง SQL รวม
  $sql = "SELECT * FROM (" . implode(" UNION ALL ", $parts) . ") u
          WHERE u.ts IS NOT NULL
          ORDER BY u.ts DESC
          LIMIT " . (int)$limit;

  $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

  // ------- แปลงเป็นสไตล์ Activity ของ Web Admin -------
  $activities = [];
  foreach ($rows as $r) {
    $type = $r['event_type'];
    $title = '-';
    $desc  = null;

    switch ($type) {
      case 'สร้างห้องบอส':
        $title = "สร้างห้อง #{$r['room_id']}";
        $desc  = "บอส " . ($r['boss'] ?? '-');
        break;
      case 'เข้าร่วมห้องบอส':
        $title = "เข้าร่วมห้อง #{$r['room_id']}";
        $desc  = "โดย " . ($r['actor_name'] ?? ('#'.$r['actor_user_id'])) . " • บอส " . ($r['boss'] ?? '-');
        break;
      case 'เขียนรีวิว':
        $title = "เขียนรีวิวห้อง #{$r['room_id']}";
        $desc  = "คะแนน " . (isset($r['rating']) ? (float)$r['rating'] : '-') . " • บอส " . ($r['boss'] ?? '-');
        break;
      case 'ได้รับรีวิว':
        $title = "ได้รับรีวิวจาก " . ($r['actor_name'] ?? ('#'.$r['actor_user_id']));
        $desc  = "ห้อง #{$r['room_id']} • บอส " . ($r['boss'] ?? '-') . " • คะแนน " . (isset($r['rating']) ? (float)$r['rating'] : '-');
        break;
      case 'ส่งแชท':
        $title = "ส่งแชทในห้อง #{$r['room_id']}";
        $desc  = "โดย " . ($r['actor_name'] ?? ('#'.$r['actor_user_id']));
        break;
      case 'เพิ่มเพื่อน':
        $title = "เพิ่มเพื่อน";
        $desc  = ($r['actor_name'] ?? ('#'.$r['actor_user_id'])) . " ↔ " . ($r['target_name'] ?? ('#'.$r['target_user_id']));
        break;
    }

    $activities[] = [
      "id"         => (int)$r['id'],
      "type"       => $type,
      "title"      => $title,
      "description"=> $desc,
      "created_at" => $r['ts'],
      "meta"       => [
        "room_id"       => isset($r['room_id']) ? (is_null($r['room_id']) ? null : (int)$r['room_id']) : null,
        "boss"          => $r['boss'] ?? null,
        "actor_id"      => isset($r['actor_user_id'])  ? (is_null($r['actor_user_id'])  ? null : (int)$r['actor_user_id'])  : null,
        "actor_name"    => $r['actor_name'] ?? null,
        "target_id"     => isset($r['target_user_id']) ? (is_null($r['target_user_id']) ? null : (int)$r['target_user_id']) : null,
        "target_name"   => $r['target_name'] ?? null,
        "rating"        => isset($r['rating']) ? (is_null($r['rating']) ? null : (float)$r['rating']) : null,
        "comment"       => $r['comment'] ?? null,
      ],
    ];
  }

  json_out(true, ["activities" => $activities, "limit" => $limit], "โหลดกิจกรรมล่าสุดสำเร็จ");

} catch (Throwable $e) {
  error_log("activities/recent error: ".$e->getMessage());
  json_out(false, null, "Server error", 500);
}
