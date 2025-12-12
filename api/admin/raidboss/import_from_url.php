<?php
// api/admin/raidboss/import_from_url.php
declare(strict_types=1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/db.php";   // $pdo
require_once __DIR__ . "/../../config/jwt.php";  // verify_jwt

/** ---------- Auth ---------- */
$headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
$authHeader = ($headers['Authorization'] ?? '') ?: ($_SERVER['HTTP_AUTHORIZATION'] ?? '') ?: ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $m)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "กรุณาใส่ Token"]);
    exit;
}
$token = $m[1];

try {
    $decoded = verify_jwt($token);
    if (!isset($decoded->role) || !in_array($decoded->role, ['admin'], true)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "ไม่มีสิทธิ์เข้าถึง"]);
        exit;
    }

    /** ---------- Input ---------- */
    $input = json_decode(file_get_contents('php://input'), true);
    
    // รับค่าวันที่
    $start_date = trim((string)($input['start_date'] ?? '')); 
    $end_date   = trim((string)($input['end_date'] ?? ''));

    // --- ตรวจสอบ Data (รับเฉพาะ Data ที่ส่งตรงมาเท่านั้น) ---
    if (!isset($input['data']) || !is_array($input['data'])) {
        throw new Exception("ไม่พบข้อมูลรายการบอส (กรุณาเลือกข้อมูลและกดนำเข้าใหม่)");
    }
    
    $arr = $input['data'];

    /** ---------- Prepare SQL ---------- */
    // เพิ่มคอลัมน์ type ลงไปใน SQL
    $sql = "INSERT INTO raid_boss
        (pokemon_id, pokemon_name, pokemon_image, pokemon_tier, type, start_date, end_date,
         cp_normal_min, cp_normal_max, cp_boost_min, cp_boost_max, maximum, created_at)
        VALUES
        (:pokemon_id, :pokemon_name, :pokemon_image, :pokemon_tier, :type, :start_date, :end_date,
         :cp_normal_min, :cp_normal_max, :cp_boost_min, :cp_boost_max, 10, NOW())";

    $stmtInsert = $pdo->prepare($sql);

    // เช็คซ้ำตามชื่อ + tier + type (เพื่อความชัวร์)
    $stmtCheck = $pdo->prepare('SELECT id FROM raid_boss WHERE pokemon_name = ? AND pokemon_tier = ? AND type = ? LIMIT 1');

    $pdo->beginTransaction();
    $inserted = 0;

    foreach ($arr as $item) {
        // ----- Extract Data -----
        $name  = trim((string)($item['name'] ?? $item['pokemon_name'] ?? ''));
        $image = (string)($item['image'] ?? $item['pokemon_image'] ?? '');
        $tier_str = (string)($item['tier'] ?? $item['pokemon_tier'] ?? '');

        if ($name === '') continue; // ข้ามถ้าไม่มีชื่อ

        // ----- Logic: Type -----
        // ถ้ามี Shadow -> shadow, ถ้ามี Mega -> mega, อื่นๆ -> normal
        $type = 'normal';
        if (stripos($tier_str, 'Shadow') !== false) {
            $type = 'shadow';
        } elseif (stripos($tier_str, 'Mega') !== false) {
            $type = 'mega';
        }

        // ----- Logic: Tier Number -----
        // ดึงตัวเลขออกจาก string (เช่น "Tier 5" -> 5)
        $tier_num = 0;
        if (preg_match('/(\d+)/', $tier_str, $tm)) {
            $tier_num = (int)$tm[1];
        } else {
            // ถ้าไม่เจอตัวเลข ให้กำหนดค่า Default ตามประเภท
            if ($type === 'mega') $tier_num = 4; // ปกติ Mega มักเทียบเท่า Tier 4
            elseif ($type === 'shadow') $tier_num = 5; // Shadow มักเป็น Tier 1,3,5 (ใส่ 5 ไว้ก่อนถ้าหาไม่เจอ)
            else $tier_num = 1;
        }

        // ----- Combat Power -----
        // เช็คเผื่อโครงสร้าง array ซ้อนกัน
        $cp_normal_min = (int)($item['combatPower']['normal']['min']   ?? 0);
        $cp_normal_max = (int)($item['combatPower']['normal']['max']   ?? 0);
        $cp_boost_min  = (int)($item['combatPower']['boosted']['min']  ?? 0);
        $cp_boost_max  = (int)($item['combatPower']['boosted']['max']  ?? 0);

        // Date Format
        $sd = $start_date !== '' ? str_replace('T', ' ', $start_date) : null;
        $ed = $end_date   !== '' ? str_replace('T', ' ', $end_date)   : null;

        // ----- Check Duplicate -----
        $stmtCheck->execute([$name, $tier_num, $type]);
        if ($stmtCheck->fetch()) {
            continue; // มีแล้วข้าม
        }

        // ----- Insert -----
        $stmtInsert->execute([
            ':pokemon_id'     => 0, // ไม่ทราบ ID ใส่ 0
            ':pokemon_name'   => $name,
            ':pokemon_image'  => $image,
            ':pokemon_tier'   => $tier_num,
            ':type'           => $type, // ใส่ type ตามที่คำนวณได้
            ':start_date'     => $sd,
            ':end_date'       => $ed,
            ':cp_normal_min'  => $cp_normal_min,
            ':cp_normal_max'  => $cp_normal_max,
            ':cp_boost_min'   => $cp_boost_min,
            ':cp_boost_max'   => $cp_boost_max,
        ]);

        $inserted++;
    }

    $pdo->commit();

    echo json_encode([
        'success'  => true,
        'message'  => 'นำเข้าข้อมูลสำเร็จ',
        'inserted' => $inserted
    ]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}