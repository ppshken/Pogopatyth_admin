<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php'; // เชื่อมต่อฐานข้อมูล (ตั้งค่า $pdo ในไฟล์นี้)

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'กรุณาระบุ user_id']);
    exit;
}

// ค้นหาผู้ใช้ตาม user_id
try{
$stmt = $pdo->prepare('SELECT id, email, trainer_name, friend_code, level, team, created_at FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'ไม่พบผู้ใช้ที่ต้องการ']);
    exit;
}
// ส่งข้อมูลผู้ใช้
echo json_encode(['success' => true, 'data' => $user]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        'error' => $e->getMessage()
    ]);
}