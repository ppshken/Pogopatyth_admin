<?php
// api/admin/reports/update.php

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

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ฟังก์ชันสำหรับส่ง Expo Push Notification
function sendExpoNotification($to, $title, $body, $data = []) {
    $url = 'https://exp.host/--/api/v2/push/send';
    
    $postData = [
        'to' => $to,
        'title' => $title,
        'body' => $body,
        'data' => $data,
        'sound' => 'default'
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

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

    // ✅ ตรวจสอบว่ามีรายงานนี้จริงไหม และ Join เพื่อเอา device_token ของ User เจ้าของ report
    // สมมติว่าตาราง reports มีคอลัมน์ user_id ที่เชื่อมกับตาราง users
    $sql = "SELECT r.id, r.status, u.device_token 
            FROM reports r
            LEFT JOIN users u ON r.reporter_id = u.id 
            WHERE r.id = ?";
            
    $stmt = $pdo->prepare($sql);
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

    // ---------------------------------------------------------
    // ✅ ส่วนของการส่ง Notification (เพิ่มใหม่)
    // ---------------------------------------------------------
    if (!empty($report['device_token'])) {
        $notifTitle = "อัปเดตสถานะรายงาน";
        $notifBody = "";

        // กำหนดข้อความตามสถานะ
        switch ($status) {
            case 'reviewed':
                $notifBody = "เจ้าหน้าที่กำลังตรวจสอบรายงานปัญหาของคุณ";
                break;
            case 'resolved':
                $notifBody = "รายงานปัญหาของคุณได้รับการแก้ไขเรียบร้อยแล้ว";
                break;
            // case 'pending': อาจจะไม่ต้องส่ง หรือส่งว่า "สถานะถูกเปลี่ยนเป็นรอดำเนินการ"
        }

        // ส่งเฉพาะถ้ามีข้อความ Body (คือสถานะเปลี่ยนเป็น reviewed หรือ resolved)
        if (!empty($notifBody)) {
            // ตรวจสอบว่าเป็น Expo Token ที่ถูกต้องเบื้องต้น
            if (strpos($report['device_token'], 'ExponentPushToken') === 0) {
                sendExpoNotification(
                    $report['device_token'], 
                    $notifTitle, 
                    $notifBody, 
                    ["report_id" => $reportId, "status" => $status]
                );
            }
        }
    }
    // ---------------------------------------------------------

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
?>