<?php
// CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";
require_once __DIR__ . "/../../config/jwt.php";

// ✅ ตรวจสอบ Token
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? 
              $_SERVER['HTTP_AUTHORIZATION'] ?? 
              $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]);
    exit;
}
$token = $matches[1];

try {
    $decoded = verify_jwt($token);

    if (!in_array($decoded->role, ['admin'])) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    // ✅ Pagination
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
    $offset = ($page - 1) * $limit;

    // ✅ Search
    $search = $_GET['search'] ?? '';
    $whereSql = "WHERE 1=1";
    $params = [];

    if ($search) {
        $whereSql .= " AND (target_id LIKE ? OR reporter_id LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    // ✅ ดึงข้อมูลผู้ใช้
    $sql = "SELECT 
            id,
            report_type,
            target_id,
            reporter_id,
            reason,
            status,
            created_at,
            updated_at
            FROM reports
            ORDER BY created_at DESC
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ นับจำนวนทั้งหมด
    $sqlCount = "SELECT COUNT(*) FROM reports $whereSql";
    $stmtCount = $pdo->prepare($sqlCount);
    $stmtCount->execute($params);
    $total = $stmtCount->fetchColumn();

    echo json_encode([
        "success" => true,
        "data" => $reports,
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => intval($total),
            "total_pages" => ceil($total / $limit)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        "success" => false, 
        "message" => "Token ไม่ถูกต้องหรือหมดอายุ", 
        "error" => $e->getMessage()
    ]);
}
