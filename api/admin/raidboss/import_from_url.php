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

require_once __DIR__ . "/../../config/db.php";   // ต้องมี $pdo (PDO)
require_once __DIR__ . "/../../config/jwt.php";  // verify_jwt($token)

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
    $data = json_decode(file_get_contents('php://input'), true);
    $url        = trim((string)($data['url'] ?? ''));
    $start_date = trim((string)($data['start_date'] ?? ''));  // optional
    $end_date   = trim((string)($data['end_date'] ?? ''));    // optional

    if ($url === '') {
        throw new Exception('กรุณาระบุ url');
    }

    /** ---------- Fetch external JSON ---------- */
    $opts = [
        'http' => [
            'method'  => 'GET',
            'header'  => "User-Agent: pogopartyth-import/1.0\r\n",
            'timeout' => 20,
        ]
    ];
    $context = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        throw new Exception('ไม่สามารถดึงข้อมูลจาก URL ได้');
    }

    $arr = json_decode($raw, true);
    if (!is_array($arr)) {
        throw new Exception('ข้อมูลจาก URL ไม่ใช่รูปแบบอาเรย์ของรายการบอส');
    }

    /** ---------- Prepare ---------- */
    // แนะนำ: คอลัมน์ในตารางควรเป็น cp_boost_min/cp_boost_max (ไม่ใช่ cp_boots_*)
    $sql = "INSERT INTO raid_boss
        (pokemon_id, pokemon_name, pokemon_image, pokemon_tier, start_date, end_date,
         cp_normal_min, cp_normal_max, cp_boost_min, cp_boost_max, maximum, created_at)
        VALUES
        (:pokemon_id, :pokemon_name, :pokemon_image, :pokemon_tier, :start_date, :end_date,
         :cp_normal_min, :cp_normal_max, :cp_boost_min, :cp_boost_max, 10, NOW())";

    $stmtInsert = $pdo->prepare($sql);

    // เช็คซ้ำตามชื่อ + tier (ตัวเลข) ถ้ามี UNIQUE KEY ก็ใช้ ON DUPLICATE แทนได้
    $stmtCheck = $pdo->prepare('SELECT id FROM raid_boss WHERE pokemon_name = ? AND pokemon_tier = ? LIMIT 1');

    $pdo->beginTransaction();
    $inserted = 0;

    foreach ($arr as $item) {
        // ----- map fields -----
        $name  = trim((string)($item['name']  ?? ''));
        $tier  = (string)($item['tier'] ?? '');     // "Tier 3", "Mega", "Shadow Tier 5", ...
        $image = (string)($item['image'] ?? '');

        if ($name === '') {
            // ข้ามแถวว่าง
            continue;
        }

        // tier_num: ดึงเลขออกมา ถ้าไม่มี (เช่น "Mega") -> 0
        $tier_num = 4;
        if (preg_match('/(\d+)/', $tier, $tm)) {
            $tier_num = (int)$tm[1];
        }

        // combat power (ตั้งค่าดีฟอลต์ให้ไม่พัง)
        $cp_normal_min = (int)($item['combatPower']['normal']['min']   ?? 0);
        $cp_normal_max = (int)($item['combatPower']['normal']['max']   ?? 0);
        $cp_boost_min  = (int)($item['combatPower']['boosted']['min']  ?? 0);
        $cp_boost_max  = (int)($item['combatPower']['boosted']['max']  ?? 0);

        // start/end (optional): รองรับทั้ง "2025-10-06T12:00" และ "2025-10-06 12:00"
        $sd = $start_date !== '' ? str_replace('T', ' ', $start_date) : null;
        $ed = $end_date   !== '' ? str_replace('T', ' ', $end_date)   : null;

        // เช็คซ้ำ
        $stmtCheck->execute([$name, $tier_num]);
        if ($stmtCheck->fetch()) {
            // มีแล้ว ข้าม (หรือจะอัปเดตก็ได้)
            continue;
        }

        $stmtInsert->execute([
            ':pokemon_id'     => 0,        // ไม่ทราบ id ภายนอก -> เก็บ 0
            ':pokemon_name'   => $name,
            ':pokemon_image'  => $image,
            ':pokemon_tier'   => $tier_num,
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
