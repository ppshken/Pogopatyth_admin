<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php';

try {
	// Support DELETE method or POST with JSON body or query param
	$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

	$id = null;

	if ($method === 'DELETE') {
		// php://input may contain JSON with { "id": 123 }
		$payload = json_decode(file_get_contents('php://input'), true);
		$id = isset($payload['id']) ? intval($payload['id']) : null;
	} elseif ($method === 'POST') {
		$payload = json_decode(file_get_contents('php://input'), true);
		$id = isset($payload['id']) ? intval($payload['id']) : null;
		// fallback to form-encoded POST
		if (!$id && isset($_POST['id'])) $id = intval($_POST['id']);
	} else {
		// allow GET for quick testing: /delete.php?id=123
		if (isset($_GET['id'])) $id = intval($_GET['id']);
	}

	if (!$id) {
		echo json_encode(['success' => false, 'message' => 'ไม่พบ id ของผู้ใช้']);
		exit;
	}

	// ตรวจสอบว่าผู้ใช้มีอยู่หรือไม่
	$check = $pdo->prepare('SELECT id FROM users WHERE id = ?');
	$check->execute([$id]);
	if (!$check->fetch()) {
		echo json_encode(['success' => false, 'message' => 'ไม่พบผู้ใช้ที่ต้องการลบ']);
		exit;
	}

	// ลบผู้ใช้
	$stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
	$ok = $stmt->execute([$id]);

	if ($ok) {
		echo json_encode(['success' => true, 'message' => 'ลบผู้ใช้เรียบร้อยแล้ว']);
	} else {
		echo json_encode(['success' => false, 'message' => 'ไม่สามารถลบผู้ใช้ได้']);
	}

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', 'error' => $e->getMessage()]);
}

