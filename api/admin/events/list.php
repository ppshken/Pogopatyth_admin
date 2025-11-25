<?php
// CORS Setup
header("Access-Control-Allow-Origin: *"); // หรือระบุ domain ที่อนุญาต
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ 1. ตรวจสอบ Token
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

try {
    // Verify JWT (ฟังก์ชันนี้ต้องมีใน jwt.php)
    $decoded = verify_jwt($matches[1]);
    
    // เช็ค Role (ถ้าจำเป็น)
    if (!isset($decoded->role) || $decoded->role !== 'admin') {
        // throw new Exception("Access denied"); // Uncomment ถ้าต้องการจำกัดสิทธิ์
    }

    // ✅ 2. รับค่า Parameters (Page, Limit, Search)
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $search = isset($_GET['search']) ? trim($_GET['search']) : "";

    if ($page < 1) $page = 1;
    if ($limit < 1) $limit = 10;
    $offset = ($page - 1) * $limit;

    // ✅ 3. สร้าง SQL Query
    // Query สำหรับนับจำนวนทั้งหมด (Total Count)
    $sqlCount = "SELECT COUNT(*) FROM events";
    $params = [];

    // ถ้ามีการค้นหา
    if (!empty($search)) {
        $sqlCount .= " WHERE title LIKE :search OR description LIKE :search";
        $params[':search'] = "%$search%";
    }

    $stmtCount = $pdo->prepare($sqlCount);
    $stmtCount->execute($params);
    $totalItems = $stmtCount->fetchColumn();

    // Query สำหรับดึงข้อมูล (Data Fetch)
    $sql = "SELECT * FROM events";
    if (!empty($search)) {
        $sql .= " WHERE title LIKE :search OR description LIKE :search";
    }
    
    // เรียงลำดับล่าสุดขึ้นก่อน และทำ Pagination
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);

    // Bind params for Search
    if (!empty($search)) {
        $stmt->bindValue(':search', "%$search%", PDO::PARAM_STR);
    }
    
    // Bind params for Limit/Offset (ต้องระบุ type เป็น INT ไม่งั้นบาง DB error)
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ 4. คำนวณ Pagination Info
    $totalPages = ceil($totalItems / $limit);

    // ✅ 5. ส่งผลลัพธ์ JSON
    echo json_encode([
        "success" => true,
        "data" => $events,
        "pagination" => [
            "total" => (int)$totalItems,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => $totalPages
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}
?>