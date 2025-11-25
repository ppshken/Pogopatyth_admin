<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: DELETE, POST, OPTIONS"); // รองรับ DELETE method
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

    // ✅ รับค่า JSON
    $data = json_decode(file_get_contents("php://input"), true);
    
    // กรณีส่งมาเป็น JSON Body
    $id = intval($data['id'] ?? 0);

    // กรณีส่งมาเป็น Query Param (เผื่อไว้ใช้กับ Axios.delete)
    if ($id === 0 && isset($_GET['id'])) {
        $id = intval($_GET['id']);
    }

    if (!$id) {
        throw new Exception("กรุณาระบุ ID ของกิจกรรมที่ต้องการลบ");
    }

    // ✅ Delete ข้อมูล
    $stmt = $pdo->prepare("DELETE FROM `events` WHERE `id` = :id");
    $stmt->execute([":id" => $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "success" => true,
            "message" => "ลบกิจกรรมเรียบร้อยแล้ว"
        ]);
    } else {
        throw new Exception("ไม่พบข้อมูล หรือข้อมูลถูกลบไปแล้ว");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>