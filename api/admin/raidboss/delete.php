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
// api/admin/users/delete.php

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ตรวจสอบ Authorization
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

    // ✅ admin เท่านั้น
    if (!in_array($decoded->role, ['admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    $input = json_decode(file_get_contents("php://input"), true);
    $raid_boss_id = $input['raid_boss_id'] ?? null;

    if (!$raid_boss_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "กรุณาส่ง raid_boss_id"]);
        exit;
    }

    // ตรวจสอบว่ามี user อยู่จริง
    $stmt = $pdo->prepare("SELECT id FROM raid_boss WHERE id = :id");
    $stmt->execute([":id" => $raid_boss_id]);
    $exists = $stmt->fetchColumn();

    if (!$exists) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "ไม่พบบอส"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM raid_boss WHERE id = :id");
        $stmt->execute(['id' => $raid_boss_id]);

        echo json_encode([
            "success" => true,
            "message" => "ลบบอสเรียบร้อยแล้ว"
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == "23000") { // Foreign key constraint fail
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "ไม่สามารถลบบอสนี้ได้ เนื่องจากยังมีห้องที่สร้างอยู่ ต้องลบห้องก่อน"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "เกิดข้อผิดพลาด: " . $e->getMessage()
            ]);
        }
    }

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Token ไม่ถูกต้องหรือหมดอายุ",
        "error" => $e->getMessage()
    ]);
}
