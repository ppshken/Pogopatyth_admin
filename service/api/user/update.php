<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php'; // ไฟล์เชื่อมต่อฐานข้อมูล

// รับข้อมูล JSON
$data = json_decode(file_get_contents('php://input'), true);

$id = intval($data['id'] ?? 0);
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? ''); // อาจจะว่างได้
$trainer_name = trim($data['trainer_name'] ?? '');
$friend_code = trim($data['friend_code'] ?? '');
$level = intval($data['level'] ?? 0);
$team = trim($data['team'] ?? '');

// ตรวจสอบ id
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ไม่พบ ID ผู้ใช้']);
    exit;
}

// ตรวจสอบ email อย่างน้อยต้องมี
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'กรุณากรอกอีเมล']);
    exit;
}

try {
    if ($password) {
        // ถ้ามีการเปลี่ยน password → update พร้อม hash
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            UPDATE users 
            SET email = ?, password = ?, trainer_name = ?, friend_code = ?, level = ?, team = ?
            WHERE id = ?
        ");
        $ok = $stmt->execute([$email, $hash, $trainer_name, $friend_code, $level, $team, $id]);
    } else {
        // ถ้าไม่ได้กรอกรหัสผ่านใหม่ → ไม่ update password
        $stmt = $pdo->prepare("
            UPDATE users 
            SET email = ?, trainer_name = ?, friend_code = ?, level = ?, team = ?
            WHERE id = ?
        ");
        $ok = $stmt->execute([$email, $trainer_name, $friend_code, $level, $team, $id]);
    }

    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'อัปเดตข้อมูลสำเร็จ']);
    } else {
        echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการอัปเดต']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
