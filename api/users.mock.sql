-- สร้างรหัสผ่านแฮช 123456 หนึ่งค่า (จะใช้ซ้ำ)
SET @pwd := '$2y$10$Y3khQegQ7xyYgHcSp/j51O1oU3IYhN.8p5x6LxL2rZ0dWpYq7nN1K';

-- สร้าง user 100 คน (2 admin + 98 member)
INSERT INTO users (email, username, password_hash, avatar, friend_code, level, device_token, role, created_at, status)
SELECT 
  CONCAT('user', n, '@example.com'),
  CONCAT('user', n),
  @pwd,
  CONCAT('https://i.pravatar.cc/150?img=', (n % 70) + 1),
  LPAD(FLOOR(RAND()*9999),4,'0') + 0 || '-' || LPAD(FLOOR(RAND()*9999),4,'0') || '-' || LPAD(FLOOR(RAND()*9999),4,'0'),
  FLOOR(1 + (RAND() * 50)),
  CONCAT('devtoken_user', n),
  CASE WHEN n <= 2 THEN 'admin' ELSE 'member' END,
  NOW() - INTERVAL FLOOR(RAND()*365) DAY,
  'active'
FROM (
  SELECT @row := @row + 1 AS n
  FROM information_schema.tables, (SELECT @row := 0) r
  LIMIT 100
) t;
