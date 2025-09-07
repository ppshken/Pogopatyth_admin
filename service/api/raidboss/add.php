<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php'; // เชื่อมต่อฐานข้อมูล

// รับข้อมูล JSON
$data = json_decode(file_get_contents('php://input'), true);

$pokemon_id = trim($data['pokemon_id'] ?? '');
$boss_name = trim($data['boss_name'] ?? '');
$boss_image = trim($data['boss_image'] ?? '');
$boss_tier = trim($data['boss_tier'] ?? '');
$start_date = intval($data['start_date'] ?? 0);
$end_date = trim($data['end_date'] ?? '');

if (!$pokemon_id || !$boss_name || !$boss_image || !$boss_tier || !$start_date || !$end_date) {
    echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
    exit;
}

// ตรวจสอบอีเมลซ้ำ
$stmt = $pdo->prepare('SELECT id FROM raid_boss WHERE pokemon_id = ?');
$stmt->execute([$pokemon_id]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'โปเกม่อนนี้ถูกเพิ่มแล้ว']);
    exit;
}

// บันทึกข้อมูล
$stmt = $pdo->prepare('INSERT INTO raid_boss (pokemon_id, boss_name, boss_image, boss_tier, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)');
$ok = $stmt->execute([$pokemon_id, $boss_name, $boss_image, $boss_tier, $start_date, $end_date]);

if ($ok) {
    echo json_encode(['success' => true, 'message' => 'เพิ่ม Raid Boss สำเร็จ']);
} else {
    echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาด']);
}