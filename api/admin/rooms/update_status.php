<?php
// api/admin/rooms/update_status.php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $m)) {
  http_response_code(401);
  echo json_encode(["success"=>false,"message"=>"กรุณาใส่ Token"]); exit;
}
try {
  $decoded = verify_jwt($m[1]);
  if (!in_array($decoded->role, ['admin'])) {
    http_response_code(403);
    echo json_encode(["success"=>false,"message"=>"ไม่มีสิทธิ์เข้าถึง"]); exit;
  }

  $input = json_decode(file_get_contents("php://input"), true);
  $id = isset($input['id']) ? intval($input['id']) : 0;
  $status = isset($input['status']) ? trim($input['status']) : '';

  $allowed = ['invited','active','closed','canceled'];
  if ($id <= 0 || !in_array($status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(["success"=>false,"message"=>"ข้อมูลไม่ถูกต้อง"]); exit;
  }

  $stmt = $pdo->prepare("UPDATE raid_rooms SET status = ? WHERE id = ?");
  $ok = $stmt->execute([$status, $id]);

  if (!$ok) { throw new Exception("อัปเดตไม่สำเร็จ"); }

  echo json_encode(["success"=>true,"message"=>"อัปเดตสถานะเรียบร้อยแล้ว","data"=>["id"=>$id,"status"=>$status]]);
} catch (Exception $e) {
  http_response_code(401);
  echo json_encode(["success"=>false,"message"=>"Token ไม่ถูกต้องหรือหมดอายุ","error"=>$e->getMessage()]);
}
