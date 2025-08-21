<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php'; // เชื่อมต่อฐานข้อมูล

// รับข้อมูล JSON
$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$trainer_name = trim($data['trainer_name'] ?? '');
$friend_code = trim($data['friend_code'] ?? '');
$level = intval($data['level'] ?? 0);
$team = trim($data['team'] ?? '');

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
    exit;
}

// ตรวจสอบอีเมลซ้ำ
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'อีเมลนี้ถูกใช้แล้ว']);
    exit;
}

// บันทึกข้อมูล
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (email, password, trainer_name, friend_code, level, team) VALUES (?, ?, ?, ?, ?, ?)');
$ok = $stmt->execute([$email, $hash, $trainer_name, $friend_code, $level, $team]);

if ($ok) {
    echo json_encode(['success' => true, 'message' => 'สมัครสมาชิกสำเร็จ']);
} else {
    echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาด']);
}