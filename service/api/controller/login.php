<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
require_once '../config/db.php'; // เชื่อมต่อฐานข้อมูล

// รับข้อมูล JSON
$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
    exit;
}

// ค้นหาผู้ใช้
$stmt = $pdo->prepare('SELECT id, password FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    // สร้าง session id
    $session_id = bin2hex(random_bytes(32));
    $user_id = $user['id'];
    $created_at = date('Y-m-d H:i:s');
    // ลบ session เก่า (optional, ป้องกันซ้ำซ้อน)
    $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$user_id]);
    // บันทึก session ใหม่
    $stmt2 = $pdo->prepare('INSERT INTO sessions (session_id, user_id, created_at) VALUES (?, ?, ?)');
    $stmt2->execute([$session_id, $user_id, $created_at]);
    echo json_encode([
        'success' => true,
        'message' => 'เข้าสู่ระบบสำเร็จ',
        'user_id' => $user_id,
        'session_id' => $session_id
    ]);
    exit;
} else {
    echo json_encode([
        'success' => false,
        'message' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    ]);
    exit;
}