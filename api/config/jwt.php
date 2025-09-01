<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . "/../../vendor/autoload.php";

$JWT_SECRET = "my_super_secret_key"; // เปลี่ยนเป็น key ของคุณ

function generate_jwt($payload) {
    global $JWT_SECRET;
    $payload['iat'] = time();
    $payload['exp'] = time() + (60 * 60 * 4); // หมดอายุ 4 ชั่วโมง
    return JWT::encode($payload, $JWT_SECRET, 'HS256');
}

function verify_jwt($token) {
    global $JWT_SECRET;
    return JWT::decode($token, new Key($JWT_SECRET, 'HS256'));
}
