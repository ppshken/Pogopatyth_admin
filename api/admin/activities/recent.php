<?php
// api/admin/activities/recent.php

// ------- CORS -------
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

function json_out($ok, $data=null, $msg='ok', $code=200) {
    http_response_code($code);
    echo json_encode(['success'=>$ok, 'data'=>$data, 'message'=>$msg], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // ------- Auth -------
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

    // ------- Limit -------
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    if ($limit <= 0) $limit = 10;
    if ($limit > 50) $limit = 50;

    $activities = [];

    // 1. User Log
    $stLog1 = $pdo->prepare("
        SELECT 
            ul.id, ul.user_id, ul.type, ul.description, ul.target, ul.created_at,
            u.username as target_username, uu.username, uu.avatar
        FROM user_log ul
        LEFT JOIN users uu ON uu.id = ul.user_id
        LEFT JOIN users u ON u.id = ul.target
        ORDER BY ul.created_at DESC 
        LIMIT 50
    ");
    $stLog1->execute(); // <--- แก้ไข: เพิ่ม execute()
    while($row = $stLog1->fetch(PDO::FETCH_ASSOC)) {
        $displayTarget = !empty($row['target_username']) ? $row['target_username'] : $row['target'];
        $activities[] = [
            'source' => 'system',
            'action' => $row['type'],
            'detail' => $row['description'],
            'target' => $displayTarget,
            'time'   => $row['created_at'],
            'by'     => $row['username'],
            'avatar' => $row['avatar']
        ];
    }

    // 2. Raid Log
    $stLog2 = $pdo->prepare("
    SELECT rrl.id, rrl.user_id, rrl.type, rrl.description, rrl.target, rrl.room_id, rrl.created_at, u.username, u.avatar 
    FROM raid_rooms_log rrl
    LEFT JOIN users u ON u.id = rrl.user_id
    ORDER BY created_at DESC LIMIT 50
    ");
    $stLog2->execute(); // <--- แก้ไข: เพิ่ม execute()
    while($row = $stLog2->fetch(PDO::FETCH_ASSOC)) {
        $activities[] = [
            'source' => 'raid',
            'action' => $row['type'],
            'detail' => $row['description'] . " (Room #" . $row['room_id'] . ")",
            'target' => $row['target'],
            'time'   => $row['created_at'],
            'by'     => $row['username'],
            'avatar' => $row['avatar']
        ];
    }

    // เรียงลำดับ activities ตามเวลาล่าสุด
    usort($activities, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    // <--- แก้ไข: ตัดข้อมูลให้เหลือตาม Limit ที่ส่งมา (เช่น ขอมา 10 ก็ส่งคืน 10 ตัวล่าสุด)
    $finalActivities = array_slice($activities, 0, $limit);

    json_out(true, ["activities" => $finalActivities, "limit" => $limit], "โหลดกิจกรรมล่าสุดสำเร็จ");

} catch (Throwable $e) {
    error_log("activities/recent error: ".$e->getMessage());
    json_out(false, null, "Server error", 500);
}