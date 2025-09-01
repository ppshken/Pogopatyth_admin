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
// api/admin/reports/update.php

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

    // ✅ รับข้อมูลจาก body
    $input = json_decode(file_get_contents("php://input"), true);
    $reportId = $input['report_id'] ?? null;
    $status = $input['status'] ?? null; // pending / reviewed / resolved

    if (!$reportId || !in_array($status, ['pending','reviewed','resolved'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ข้อมูลไม่ถูกต้อง"]);
        exit;
    }

    // ✅ ตรวจสอบว่ามีรายงานนี้จริงไหม
    $stmt = $pdo->prepare("SELECT id, status FROM reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$report) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "ไม่พบรายงานนี้"]);
        exit;
    }

    // ✅ อัปเดตสถานะ
    $stmt = $pdo->prepare("UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $reportId]);

    echo json_encode([
        "success" => true,
        "message" => "อัปเดตสถานะรายงานเรียบร้อย",
        "data" => [
            "report_id" => $reportId,
            "old_status" => $report['status'],
            "new_status" => $status
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
