<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

/** -------- Helper: ส่ง Expo Push เป็น batch และเคลียร์ token เสีย -------- */
function send_expo_push_batch(PDO $pdo, array $tokens, string $title, string $body, array $data = []): array {
    $endpoint = "https://exp.host/--/api/v2/push/send";
    // ลบว่าง/ซ้ำ + กรองรูปแบบ token ขั้นต้น
    $tokens = array_values(array_unique(array_filter($tokens, function($t){
        return is_string($t) && $t !== '' && str_starts_with($t, 'ExponentPushToken[');
    })));

    $chunks = array_chunk($tokens, 99);
    $tickets = [];
    $invalidTokens = [];

    foreach ($chunks as $chunk) {
        $messages = array_map(fn($t) => [
            "to" => $t,
            "title" => $title,
            "body" => $body,
            "sound" => "default",
            "data" => $data,
        ], $chunk);

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ["Content-Type: application/json", "Accept: application/json"],
            CURLOPT_POSTFIELDS => json_encode($messages, JSON_UNESCAPED_UNICODE),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            $tickets[] = ["status" => "error", "details" => ["error" => "curl_error", "message" => $err]];
            continue;
        }

        $json = json_decode($res, true);
        if (!isset($json["data"]) || !is_array($json["data"])) {
            $tickets[] = ["status" => "error", "details" => ["error" => "invalid_response"], "raw" => $res];
            continue;
        }

        foreach ($json["data"] as $i => $ticket) {
            $ticket["to"] = $chunk[$i] ?? null;
            $tickets[] = $ticket;

            if (($ticket["status"] ?? "") === "error") {
                $detailErr = $ticket["details"]["error"] ?? "";
                // DeviceNotRegistered = token ตาย ให้ลบทิ้ง
                if (in_array($detailErr, ["DeviceNotRegistered", "InvalidCredentials", "MessageTooBig"])) {
                    if (!empty($ticket["to"])) $invalidTokens[] = $ticket["to"];
                }
            }
        }
    }

    // เคลียร์ token เสียในตาราง users
    if ($invalidTokens) {
        $invalidTokens = array_values(array_unique($invalidTokens));
        $in = implode(",", array_fill(0, count($invalidTokens), "?"));
        $stmt = $pdo->prepare("UPDATE users SET device_token = NULL WHERE device_token IN ($in)");
        $stmt->execute($invalidTokens);
    }

    $ok = 0; $err = 0;
    foreach ($tickets as $tk) { ($tk["status"] ?? "") === "ok" ? $ok++ : $err++; }

    return [
        "total_tokens" => count($tokens),
        "sent_ok" => $ok,
        "sent_err" => $err,
        "invalid_token_cleared" => count(array_unique($invalidTokens)),
        "tickets" => $tickets,
    ];
}

/** -------- Helper: ดึง tokens จาก users ตาม target -------- */
// สมมติว่ามีตาราง user_raid_rooms(room_id, user_id) สำหรับกรณี room:{id}
function get_tokens_by_target(PDO $pdo, string $target): array {
    if ($target === "all") {
        // ถ้ามีฟิลด์ status ใช้กรองเฉพาะ active ได้ เช่น status='active' หรือ status=1
        $sql = "SELECT DISTINCT device_token FROM users WHERE device_token IS NOT NULL AND device_token <> ''";
        return $pdo->query($sql)->fetchAll(PDO::FETCH_COLUMN);
    }
    if (preg_match('/^user:(\d+)$/', $target, $m)) {
        $uid = (int)$m[1];
        $stmt = $pdo->prepare("SELECT device_token FROM users WHERE id = ? AND device_token IS NOT NULL AND device_token <> '' LIMIT 1");
        $stmt->execute([$uid]);
        $t = $stmt->fetchColumn();
        return $t ? [$t] : [];
    }
    if (preg_match('/^room:(\d+)$/', $target, $m)) {
        $rid = (int)$m[1];
        $stmt = $pdo->prepare("
          SELECT DISTINCT u.device_token
          FROM users u
          JOIN user_raid_rooms urr ON u.id = urr.user_id
          WHERE urr.room_id = ? AND u.device_token IS NOT NULL AND u.device_token <> ''
        ");
        $stmt->execute([$rid]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    return [];
}

/** -------- ตรวจ JWT / สิทธิ์ admin -------- */
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]); exit;
}

try {
    $decoded = verify_jwt($matches[1]);
    if (($decoded->role ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]); exit;
    }

    // รับ input
    $input   = json_decode(file_get_contents("php://input"), true) ?? [];
    $title   = trim((string)($input['title']   ?? ''));
    $body    = trim((string)($input['message'] ?? ''));
    $targetR = (string)($input['target'] ?? 'all');   // อาจเป็น all / user:{id} / room:{id} หรือ "user"/"room"
    $userId  = isset($input['user_id']) ? (int)$input['user_id'] : null;
    $roomId  = isset($input['room_id']) ? (int)$input['room_id'] : null;
    $extra   = $input['data'] ?? [];

    if (!$title || !$body) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "กรุณากรอก title และ message"]);
    exit;
    }

    // ปรับ target ให้แน่นอน (รองรับทั้ง 2 ฟอร์แมต)
    $targetR = trim($targetR);
    if ($targetR === 'user' && $userId) {
    $target = 'user:' . $userId;
    } elseif ($targetR === 'room' && $roomId) {
    $target = 'room:' . $roomId;
    } elseif (preg_match('/^(all|user:\d+|room:\d+)$/', $targetR)) {
    $target = $targetR;
    } else {
    $target = 'all';
    }


    // บันทึกประกาศ
    $stmt = $pdo->prepare("INSERT INTO notifications (title, message, target, sent_by) VALUES (?, ?, ?, ?)");
    $stmt->execute([$title, $body, $target, $decoded->id]);
    $notifId = (int)$pdo->lastInsertId();

    // ดึง tokens ตาม target แล้วส่ง
    $tokens = get_tokens_by_target($pdo, $target);
    $dataToSend = array_merge(["notif_id" => $notifId, "target" => $target], is_array($extra) ? $extra : []);

    $summary = !empty($tokens)
    ? send_expo_push_batch($pdo, $tokens, $title, $body, $dataToSend)
    : ["total_tokens" => 0, "sent_ok" => 0, "sent_err" => 0, "invalid_token_cleared" => 0, "tickets" => []];

    echo json_encode([
    "success" => true,
    "message" => "สร้างประกาศและส่งแจ้งเตือนเรียบร้อย",
    "data" => [
        "id" => $notifId,
        "title" => $title,
        "message" => $body,
        "target" => $target,                // ← คืนค่า target ที่ normalize แล้ว
        "sent_by" => $decoded->id,
        "push_summary" => $summary,         // ← มีตัวเลขช่วยดีบัก
        "tokens_count" => count($tokens),   // ← เพิ่มสรุปจำนวน token
    ]
    ], JSON_UNESCAPED_UNICODE);


} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Token ไม่ถูกต้องหรือหมดอายุ", "error" => $e->getMessage()]);
}
