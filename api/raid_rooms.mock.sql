-- 🔹 mock boss list
SET @bosses = JSON_ARRAY(
  JSON_OBJECT('id', 150, 'name', 'Mewtwo'),
  JSON_OBJECT('id', 384, 'name', 'Rayquaza'),
  JSON_OBJECT('id', 383, 'name', 'Groudon'),
  JSON_OBJECT('id', 249, 'name', 'Lugia'),
  JSON_OBJECT('id', 382, 'name', 'Kyogre')
);

-- 🔹 insert 100 rooms
INSERT INTO raid_rooms
(raid_boss_id, pokemon_name, pokemon_image, start_time, max_members, status, owner_id, note, avg_rating, review_count, created_at)
SELECT 
  JSON_UNQUOTE(JSON_EXTRACT(@bosses, CONCAT('$[', (n % 5), '].id'))) AS raid_boss_id,
  JSON_UNQUOTE(JSON_EXTRACT(@bosses, CONCAT('$[', (n % 5), '].name'))) AS pokemon_name,
  CONCAT(
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
    JSON_UNQUOTE(JSON_EXTRACT(@bosses, CONCAT('$[', (n % 5), '].id'))),
    '.png'
  ) AS pokemon_image,
  NOW() + INTERVAL (n % 12) HOUR AS start_time,
  5 + (n % 5) AS max_members,
  CASE 
    WHEN n % 3 = 0 THEN 'active'
    WHEN n % 3 = 1 THEN 'closed'
    ELSE 'invited'
  END AS status,
  (n % 50) + 1 AS owner_id,  -- สมมติว่ามี users อย่างน้อย 50 คน
  CONCAT('Room note ', n) AS note,
  ROUND(RAND() * 5, 1) AS avg_rating,
  FLOOR(RAND() * 20) AS review_count,
  NOW() - INTERVAL (n % 30) DAY AS created_at
FROM (
  SELECT @row := @row + 1 AS n
  FROM information_schema.tables, (SELECT @row := 0) r
  LIMIT 100
) t;
