<?php
// CORS Setup
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ปรับ Path ตามโครงสร้างโฟลเดอร์จริงของคุณ
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
    // Verify JWT
    $decoded = verify_jwt($matches[1]);
    
    // เช็ค Role Admin (ถ้าจำเป็น)
    // if (!isset($decoded->role) || $decoded->role !== 'admin') {
    //     throw new Exception("Access denied: Admins only");
    // }

    // ✅ 2. รับค่า Parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20; // Default 20
    
    // รับค่า Filter (ถ้าส่งมาว่างๆ จะถือว่าไม่กรอง)
    $search  = isset($_GET['search']) ? trim($_GET['search']) : "";
    $room_id = isset($_GET['room_id']) ? (int)$_GET['room_id'] : null;
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    $type    = isset($_GET['type']) ? trim($_GET['type']) : null;

    if ($page < 1) $page = 1;
    if ($limit < 1) $limit = 20;
    $offset = ($page - 1) * $limit;

    // ✅ 3. สร้างเงื่อนไข SQL (Dynamic WHERE)
    $conditions = [];
    $params = [];

    // กรองตาม Room ID
    if (!empty($room_id)) {
        $conditions[] = "room_id = :room_id";
        $params[':room_id'] = $room_id;
    }

    // กรองตาม User ID
    if (!empty($user_id)) {
        $conditions[] = "user_id = :user_id";
        $params[':user_id'] = $user_id;
    }

    // กรองตาม Type (เช่น 'login', 'delete', 'update')
    if (!empty($type)) {
        $conditions[] = "type = :type";
        $params[':type'] = $type;
    }

    // ค้นหา Text (Search) ใน Description หรือ Target
    if (!empty($search)) {
        $conditions[] = "(description LIKE :search OR target LIKE :search)";
        $params[':search'] = "%$search%";
    }

    // รวมเงื่อนไขทั้งหมด
    $sqlWhere = "";
    if (count($conditions) > 0) {
        $sqlWhere = " WHERE " . implode(" AND ", $conditions);
    }

    // ✅ 4. Query นับจำนวน (Count)
    // สมมติชื่อตารางคือ 'logs'
    $sqlCount = "SELECT COUNT(*) FROM raid_rooms_log" . $sqlWhere;
    $stmtCount = $pdo->prepare($sqlCount);
    
    // Bind ค่าทั้งหมด
    foreach ($params as $key => $val) {
        $stmtCount->bindValue($key, $val);
    }
    
    $stmtCount->execute();
    $totalItems = $stmtCount->fetchColumn();

    // ✅ 5. Query ดึงข้อมูล (Data Fetch)
    $sql = "SELECT 
    rrl.id, 
    rrl.room_id, 
    rrl.user_id,
    rrl.type,
    rrl.target,
    rrl.description,
    rrl.created_at,
    u.username,
    u.avatar
    FROM raid_rooms_log rrl 
    JOIN users u ON u.id = rrl.user_id" . $sqlWhere;
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);

    // Bind ค่าเงื่อนไข WHERE
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }

    // Bind ค่า Pagination (ต้องระบุ type เป็น INT)
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ 6. คำนวณ Pagination Info
    $totalPages = ceil($totalItems / $limit);

    // ✅ 7. ส่งผลลัพธ์ JSON
    echo json_encode([
        "success" => true,
        "data" => $logs,
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
        "message" => "Server Error: " . $e->getMessage()
    ]);
}
?>