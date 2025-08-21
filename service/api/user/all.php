<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php'; // เชื่อมต่อฐานข้อมูล (ตั้งค่า $pdo ในไฟล์นี้)

try {
	// รับค่าพารามิเตอร์ pagination
	$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
	$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
	if ($limit <= 0) $limit = 10;
	$maxLimit = 100; // จำกัดเพดานจำนวนรายการต่อหน้าเพื่อความปลอดภัย
	if ($limit > $maxLimit) $limit = $maxLimit;

	$offset = ($page - 1) * $limit;

	// นับจำนวนทั้งหมด
	$countStmt = $pdo->query('SELECT COUNT(*) FROM users');
	$total = (int) $countStmt->fetchColumn();

	// ดึงข้อมูลผู้ใช้แบบมี limit/offset
	$stmt = $pdo->prepare('SELECT id, email, trainer_name, friend_code, level, team, created_at FROM users ORDER BY id DESC LIMIT :limit OFFSET :offset');
	$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
	$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
	$stmt->execute();
	$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$response = [
		'success' => true,
		'page' => $page,
		'limit' => $limit,
		'total' => $total,
		'total_pages' => ($limit > 0) ? (int) ceil($total / $limit) : 0,
		'data' => $users
	];

	echo json_encode($response);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode([
		'success' => false,
		'message' => 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
		'error' => $e->getMessage()
	]);
}

