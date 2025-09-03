-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 03, 2025 at 12:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pogopartyth_v2`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `id` int(11) NOT NULL,
  `raid_rooms_id` int(11) NOT NULL,
  `sender` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat`
--

INSERT INTO `chat` (`id`, `raid_rooms_id`, `sender`, `message`, `created_at`) VALUES
(45, 64, 2, 'สดสดทด', '2025-08-31 17:21:48'),
(46, 66, 2, 'สกสดทดท', '2025-08-31 17:21:55'),
(47, 63, 4, 'สแมแมแ', '2025-08-31 17:30:05'),
(48, 67, 2, 'สวัสดีครับ', '2025-08-31 18:51:59'),
(49, 69, 2, 'สวัสดีครับ', '2025-08-31 19:14:58'),
(50, 71, 2, 'เข้ามาแล้ว ก็อปปี้ รหัส เพิ่มเพื่อนได้เลยครับ', '2025-08-31 19:31:12'),
(51, 71, 3, 'เพิ่มเพื่อนแล้วนะครับ', '2025-08-31 19:32:26'),
(52, 73, 2, 'เทสครับ', '2025-08-31 19:47:30'),
(53, 73, 2, 'Bxnx', '2025-08-31 22:22:55'),
(54, 74, 2, 'test', '2025-08-31 22:25:52'),
(55, 74, 4, 'Test', '2025-08-31 22:25:56'),
(56, 75, 4, 'ทัก', '2025-08-31 23:21:16'),
(57, 75, 4, 'Hhfc', '2025-08-31 23:23:29'),
(58, 76, 2, 'U', '2025-09-01 01:00:10'),
(59, 76, 2, 'Inn', '2025-09-01 01:00:13'),
(60, 76, 2, 'Bbb', '2025-09-01 01:00:31'),
(61, 76, 2, 'Jjnh', '2025-09-01 01:00:36'),
(62, 76, 2, 'Bbbh', '2025-09-01 01:00:45'),
(63, 75, 2, 'Hbb', '2025-09-01 01:01:37'),
(64, 76, 2, 'Hbb', '2025-09-01 01:03:07'),
(65, 76, 2, 'Jbbb', '2025-09-01 01:03:10'),
(66, 76, 2, 'Bbbhbb', '2025-09-01 01:03:13'),
(67, 76, 2, 'Jjnhbbb', '2025-09-01 01:03:16'),
(68, 76, 2, 'Bbbbbbbb', '2025-09-01 01:03:19'),
(69, 76, 2, 'Jjnbbbb', '2025-09-01 01:03:22'),
(70, 76, 2, 'Ijnnnnnnn', '2025-09-01 01:03:25'),
(71, 76, 2, 'Jjhhb', '2025-09-01 01:03:28'),
(72, 76, 2, 'Jjb', '2025-09-01 01:04:02'),
(73, 76, 4, 'เหี้ยไรสัส', '2025-09-01 01:16:53'),
(74, 75, 3, 'Isisjns', '2025-09-01 02:13:17'),
(75, 75, 3, 'จะเริ่มเมื่อไหร่', '2025-09-01 02:14:34'),
(76, 75, 2, 'Cggh', '2025-09-01 02:42:24'),
(77, 83, 4, 'Test', '2025-09-01 20:17:59'),
(78, 83, 4, 'test', '2025-09-01 20:18:06'),
(79, 83, 2, 'ควยไรสัส', '2025-09-01 20:18:13'),
(80, 83, 4, 'kuy', '2025-09-01 20:19:46'),
(81, 83, 2, 'จะเชิญได้ยังสัส', '2025-09-01 20:21:27'),
(82, 83, 2, 'หมดเวลาละควย', '2025-09-01 20:21:45'),
(83, 96, 2, 'ราา', '2025-09-01 22:15:11'),
(84, 96, 2, 'หมดเวลาแล้วครับ', '2025-09-01 22:15:20'),
(85, 97, 14, 'Yyyy', '2025-09-01 22:53:45'),
(86, 98, 4, '5636 8855 8887', '2025-09-01 23:00:19'),
(87, 98, 4, 'werwer', '2025-09-01 23:29:00'),
(88, 100, 14, 'admin', '2025-09-01 23:44:46'),
(89, 100, 4, '5636 8855 8887', '2025-09-01 23:44:51'),
(90, 100, 4, 'test', '2025-09-01 23:47:27'),
(91, 100, 14, 'Bvc', '2025-09-01 23:49:11'),
(92, 100, 4, 'sdf', '2025-09-01 23:49:20'),
(93, 100, 4, 'sdfsdf', '2025-09-01 23:49:23'),
(94, 100, 14, 'จะเสร็จยัง', '2025-09-01 23:56:13'),
(95, 100, 4, 'pap', '2025-09-01 23:56:21'),
(96, 100, 4, 'Tsetse', '2025-09-01 23:56:27'),
(97, 100, 4, 'testsetset', '2025-09-01 23:56:31'),
(98, 100, 4, 'estse', '2025-09-01 23:56:35'),
(99, 100, 4, 'setsetset', '2025-09-01 23:56:39'),
(100, 100, 4, 'setsetset', '2025-09-01 23:56:43'),
(101, 100, 4, 'setsetsetsetset', '2025-09-01 23:56:47'),
(102, 100, 4, 'asdasd', '2025-09-01 23:57:33'),
(103, 101, 14, 'พร้อมไหม', '2025-09-02 00:47:43'),
(104, 102, 14, 'นาื', '2025-09-02 01:07:34'),
(105, 102, 14, 'าานา', '2025-09-02 01:07:43'),
(106, 102, 14, 'ชวนแล้วนะครับ', '2025-09-02 01:07:50'),
(107, 102, 1, 'test', '2025-09-02 01:10:15'),
(108, 102, 1, 'tete', '2025-09-02 01:10:19'),
(109, 102, 14, 'สสยส', '2025-09-02 01:10:25'),
(110, 102, 1, 'setset', '2025-09-02 01:10:28'),
(111, 102, 1, 'setset', '2025-09-02 01:10:34'),
(112, 102, 1, 'setsetset', '2025-09-02 01:10:40'),
(113, 102, 1, 'setset', '2025-09-02 01:10:48'),
(114, 102, 1, 'setsetestset', '2025-09-02 01:10:53'),
(115, 102, 1, 'tsetsetsetset', '2025-09-02 01:10:57'),
(116, 102, 1, 'setestsetset', '2025-09-02 01:11:03'),
(117, 102, 1, 'testestset', '2025-09-02 01:11:15'),
(118, 102, 14, 'เทสๆ', '2025-09-02 01:12:23'),
(119, 102, 14, 'สททืืท', '2025-09-02 01:12:26'),
(120, 103, 14, 'Test', '2025-09-03 10:55:22');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target` varchar(50) DEFAULT 'all',
  `sent_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `title`, `message`, `target`, `sent_by`, `created_at`) VALUES
(1, 'กิจกรรมสุดสัปดาห์!', 'เจอบอสพิเศษ Mewtwo ทุกสาขา', 'all', 1, '2025-09-01 06:07:47'),
(2, 'แจ้งเตือน', 'ระบบจะปิดปรับปรุงคืนนี้ 23.00 น.', 'all', 1, '2025-09-01 06:07:47'),
(3, 'กิจกรรมพิเศษ!', 'พรุ่งนี้เจอบอส Rayquaza ที่ทุกสาขา!', 'all', 1, '2025-09-01 06:08:53');

-- --------------------------------------------------------

--
-- Table structure for table `raid_boss`
--

CREATE TABLE `raid_boss` (
  `id` int(11) NOT NULL,
  `pokemon_id` int(11) NOT NULL,
  `pokemon_name` varchar(100) NOT NULL,
  `pokemon_image` varchar(255) DEFAULT NULL,
  `pokemon_tier` int(11) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raid_boss`
--

INSERT INTO `raid_boss` (`id`, `pokemon_id`, `pokemon_name`, `pokemon_image`, `pokemon_tier`, `start_date`, `end_date`, `created_at`) VALUES
(1, 150, 'Mewtwo', 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/150.png', 5, '2025-08-25 00:00:00', '2025-09-05 23:59:59', '2025-08-30 17:23:15'),
(2, 384, 'Rayquaza', 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/384.png', 4, '2025-08-28 00:00:00', '2025-09-05 23:59:59', '2025-08-30 17:23:15'),
(3, 6, 'Charizard', 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 4, '2025-08-31 00:00:00', '2025-09-05 00:00:00', '2025-08-31 11:11:37'),
(4, 9, 'Blastoise', 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 3, '2025-08-28 11:12:47', '2025-09-05 11:12:47', '2025-08-31 11:13:23');

-- --------------------------------------------------------

--
-- Table structure for table `raid_reviews`
--

CREATE TABLE `raid_reviews` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raid_reviews`
--

INSERT INTO `raid_reviews` (`id`, `room_id`, `user_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(22, 59, 4, 4, 'Raid success', '2025-08-31 16:29:26', NULL),
(23, 59, 2, 5, 'Raid success', '2025-08-31 17:21:42', NULL),
(24, 67, 4, 4, 'Raid success', '2025-08-31 19:01:05', NULL),
(25, 67, 2, 3, 'Raid success', '2025-08-31 19:01:49', NULL),
(26, 74, 4, 5, 'Raid success', '2025-08-31 23:04:30', NULL),
(27, 74, 2, 5, 'Raid success', '2025-08-31 23:04:36', NULL),
(28, 76, 4, 5, 'Raid success', '2025-09-01 02:00:52', NULL),
(29, 76, 2, 5, 'Raid success', '2025-09-01 02:00:58', NULL),
(30, 80, 4, 5, 'Raid success', '2025-09-01 19:54:05', NULL),
(31, 80, 2, 5, 'Raid success', '2025-09-01 19:54:10', NULL),
(32, 81, 2, 5, 'Raid success', '2025-09-01 20:09:42', NULL),
(33, 81, 4, 5, 'Raid success', '2025-09-01 20:09:47', NULL),
(34, 82, 4, 5, 'Raid success', '2025-09-01 20:15:53', NULL),
(35, 82, 2, 5, 'Raid success', '2025-09-01 20:15:57', NULL),
(36, 84, 4, 1, 'FAILED: คนไม่ครบ', '2025-09-01 20:39:02', NULL),
(37, 85, 4, 5, 'Raid success', '2025-09-01 21:00:28', NULL),
(38, 84, 2, 1, 'FAILED: คนไม่ครบ', '2025-09-01 21:00:42', NULL),
(39, 85, 2, 1, 'FAILED: ควย', '2025-09-01 21:01:00', NULL),
(40, 95, 4, 1, 'FAILED: คนไม่ครบ', '2025-09-01 22:04:16', NULL),
(41, 95, 2, 5, 'Raid success', '2025-09-01 22:04:22', NULL),
(42, 98, 14, 5, 'Raid success', '2025-09-01 23:29:26', NULL),
(43, 98, 4, 5, 'Raid success', '2025-09-01 23:29:31', NULL),
(44, 100, 14, 5, 'Raid success', '2025-09-02 00:17:39', NULL),
(45, 101, 1, 1, 'FAILED: เวลาไม่พอ / เข้าไม่ทัน', '2025-09-02 00:48:31', NULL),
(46, 101, 14, 5, 'Raid success', '2025-09-02 00:48:48', NULL),
(47, 102, 14, 5, 'Raid success', '2025-09-03 10:55:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `raid_rooms`
--

CREATE TABLE `raid_rooms` (
  `id` int(11) NOT NULL,
  `raid_boss_id` int(11) NOT NULL,
  `pokemon_image` varchar(255) NOT NULL,
  `boss` varchar(255) NOT NULL,
  `start_time` datetime NOT NULL,
  `max_members` int(11) NOT NULL,
  `status` enum('active','closed','canceled','invited') NOT NULL DEFAULT 'active',
  `owner_id` int(11) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `avg_rating` decimal(3,2) DEFAULT NULL,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `raid_rooms`
--

INSERT INTO `raid_rooms` (`id`, `raid_boss_id`, `pokemon_image`, `boss`, `start_time`, `max_members`, `status`, `owner_id`, `note`, `avg_rating`, `review_count`, `created_at`) VALUES
(58, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 16:10:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 16:05:13'),
(59, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-08-31 16:30:00', 3, 'invited', 4, NULL, 4.50, 2, '2025-08-31 16:22:56'),
(60, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 16:35:00', 6, 'closed', 4, NULL, NULL, 0, '2025-08-31 16:30:10'),
(61, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 16:40:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 16:36:51'),
(62, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 16:45:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 16:39:24'),
(63, 2, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/384.png', 'Rayquaza', '2025-08-31 17:40:00', 6, 'closed', 4, 'ขอคนมีบัตรครับ', NULL, 0, '2025-08-31 16:46:55'),
(64, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 17:50:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 16:51:36'),
(65, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-08-31 17:05:00', 6, 'closed', 4, NULL, NULL, 0, '2025-08-31 16:57:48'),
(66, 1, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/150.png', 'Mewtwo', '2025-08-31 18:00:00', 5, 'closed', 4, 'เชิญเมื่อคนครบครับ', NULL, 0, '2025-08-31 17:05:15'),
(67, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 19:00:00', 2, 'invited', 4, NULL, 3.50, 2, '2025-08-31 18:51:43'),
(68, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-08-31 19:00:00', 6, 'closed', 4, NULL, NULL, 0, '2025-08-31 19:00:27'),
(69, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 19:20:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 19:14:39'),
(70, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 19:30:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 19:24:09'),
(71, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 19:35:00', 5, 'closed', 2, 'มีคนสนใจตีไหมครับ\nเข้ามาได้เลยนะครับ', NULL, 0, '2025-08-31 19:30:46'),
(72, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-08-31 19:45:00', 6, 'closed', 2, NULL, NULL, 0, '2025-08-31 19:38:27'),
(73, 1, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/150.png', 'Mewtwo', '2025-08-31 19:50:00', 5, 'closed', 4, 'เทสๆ', NULL, 0, '2025-08-31 19:45:19'),
(74, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-08-31 22:35:00', 5, 'invited', 4, 'test', 5.00, 2, '2025-08-31 22:23:29'),
(75, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 05:00:00', 6, 'closed', 4, NULL, NULL, 0, '2025-08-31 23:21:10'),
(76, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 05:00:00', 6, 'invited', 2, NULL, 5.00, 2, '2025-09-01 01:00:05'),
(77, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 05:00:00', 6, 'closed', 4, NULL, NULL, 0, '2025-09-01 01:38:01'),
(78, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-09-01 05:00:00', 6, 'closed', 4, NULL, NULL, 0, '2025-09-01 02:07:35'),
(79, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 05:00:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 02:20:43'),
(80, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 20:00:00', 2, 'invited', 2, NULL, 5.00, 2, '2025-09-01 19:52:04'),
(81, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-09-01 20:00:00', 3, 'invited', 4, NULL, 5.00, 2, '2025-09-01 19:54:52'),
(82, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-09-01 20:15:00', 3, 'invited', 4, NULL, 5.00, 2, '2025-09-01 20:09:58'),
(83, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-09-01 20:20:00', 3, 'closed', 4, NULL, NULL, 0, '2025-09-01 20:16:04'),
(84, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-09-01 20:35:00', 2, 'invited', 4, 'Ldkfgjorkgoslrogks;;dgpgodkfgow', 1.00, 2, '2025-09-01 20:24:29'),
(85, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 20:50:00', 6, 'invited', 4, NULL, 3.00, 2, '2025-09-01 20:48:31'),
(86, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 20:55:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 20:49:00'),
(87, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:30:00', 4, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:09:46'),
(88, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:30:00', 4, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:12:16'),
(89, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:25:00', 6, 'closed', 4, NULL, NULL, 0, '2025-09-01 21:18:11'),
(90, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:25:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:18:43'),
(91, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:50:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:33:14'),
(92, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:50:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:36:39'),
(93, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 21:50:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:40:42'),
(94, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 22:00:00', 6, 'closed', 2, NULL, NULL, 0, '2025-09-01 21:51:36'),
(95, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 22:05:00', 6, 'invited', 2, NULL, 3.00, 2, '2025-09-01 22:01:48'),
(96, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 22:15:00', 2, 'closed', 4, 'Need Have Remote Pass Battle Raid Boss Now\nInvited All Ready.', NULL, 0, '2025-09-01 22:06:39'),
(97, 4, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/009.png', 'Blastoise', '2025-09-01 22:55:00', 6, 'closed', 14, NULL, NULL, 0, '2025-09-01 22:53:38'),
(98, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-02 05:00:00', 6, 'invited', 14, NULL, 5.00, 2, '2025-09-01 23:00:02'),
(99, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-01 23:40:00', 6, 'closed', 4, NULL, NULL, 0, '2025-09-01 23:30:05'),
(100, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-02 05:00:00', 6, 'invited', 14, NULL, 5.00, 1, '2025-09-01 23:43:48'),
(101, 2, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/384.png', 'Rayquaza', '2025-09-02 05:00:00', 6, 'invited', 14, NULL, 3.00, 2, '2025-09-02 00:17:50'),
(102, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-02 05:00:00', 6, 'invited', 14, NULL, 5.00, 1, '2025-09-02 00:57:04'),
(103, 3, 'https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/006.png', 'Charizard', '2025-09-03 11:00:00', 6, 'active', 14, NULL, NULL, 0, '2025-09-03 10:55:15');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `report_type` enum('user','room','other') NOT NULL,
  `target_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `username` varchar(191) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `friend_code` varchar(32) DEFAULT NULL,
  `level` int(11) NOT NULL,
  `device_token` varchar(255) DEFAULT NULL,
  `role` enum('member','admin') NOT NULL,
  `status` enum('active','banned') NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `password_hash`, `avatar`, `friend_code`, `level`, `device_token`, `role`, `status`, `created_at`) VALUES
(1, 'demo@ppth.com', 'demo_user', '$2y$10$bzDOiUCy.YXXcKCsKlRrzOcnShkR9WQjtbl3m5jPuLOFx6uh6lJ8m', 'http://localhost/pogopartyth-app-v1/api/uploads/avatars/u1_1756477697_9ee4f737.jpg', '123456789012', 30, NULL, 'admin', 'active', '2025-08-28 10:00:24'),
(2, 'kensaohin@gmail.com', 'AvenderMasterTH', '$2y$10$CqfdPoqv0ZXJqwa6pgpAyegB9TnZGOJBnR/5oS0UZHuzxHlEAzoLi', 'http://172.20.10.3/pogopartyth-app-v1/api/uploads/avatars/u2_1756739272_d4e1b8cf.jpg', '2588 6666 6547', 20, NULL, 'member', 'active', '2025-08-28 10:17:10'),
(3, 'kenzanaqq@gmail.com', 'AkenzaMasterTH', '$2y$10$zp4ZkkFrVFnNRQtdh3P4Cu5m.TreAuW68emxLMBJ3FOPNGQeVJdU2', 'http://172.20.10.3/pogopartyth-app-v1/api/uploads/avatars/u3_1756643511_e21d84a6.jpg', '3324-7735-6637', 25, 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', 'member', 'active', '2025-08-28 11:23:31'),
(4, 'test@gmail.com', 'admin', '$2y$10$OwaquWF3BCi2D1ThwAwjOO1E0kMdi5jWt6GXtqcpdBekInWQSAEGK', 'http://172.20.10.3/pogopartyth-app-v1/api/uploads/avatars/u4_1756738440_e562cb4e.jpg', '3328-5567-8849', 26, NULL, 'member', 'active', '2025-08-28 12:30:53'),
(5, 'lovekenza_007@hotmail.com', 'Lovekenza007', '$2y$10$vjgLtcL64l3Uv26rwHTfB.leXK5NTbN3iYmT78/5vp0.BB5UnPrle', NULL, '554348184946', 28, NULL, 'member', 'active', '2025-08-29 14:01:41'),
(6, 'test2@gmail.com', 'Test2', '$2y$10$j1ufX.p9P2CgVs7aO4zqgucOrt3tuPit7LjviBVuSsejcoqen7Nau', 'http://172.20.10.3/pogopartyth-app-v1/api/uploads/avatars/u6_1756747460_407aebeb.jpg', '546465846464', 29, NULL, 'member', 'active', '2025-08-29 14:03:00'),
(7, 'test3@gmail.com', 'Test3', '$2y$10$CI.mTM0UU6.Y4SFCdBLwrOtbnWFl4ZEMg8YmL/DuH6w2Axrc1biFW', 'http://172.20.10.3/pogopartyth-app-v1/api/uploads/avatars/u7_1756747427_b379f211.jpg', '515464848048', 46, NULL, 'member', 'active', '2025-08-29 14:03:31'),
(8, 'ployphapas@gmail.com', 'Purezanaqq', '$2y$10$NS3J9XPsZzZraXXSxtdtMuDVQqS8LvQfLKqHGTfpiH0g8LrqCxbxC', 'http://172.20.10.3/pogopartyth-app-v1/api/uploads/avatars/u8_1756478579_19618f5a.jpg', '548787846646', 50, NULL, 'member', 'active', '2025-08-29 21:42:17'),
(9, 'kensaohinyyyyy@gmail.com', 'llskdfirjg', '$2y$10$xeZUT31eQixvlkuvzIu8LeXQerXFWKbdzjhpln5Vjrt6I17ZElRSu', NULL, '1456 5489 5471', 0, NULL, 'member', 'active', '2025-09-01 22:43:16'),
(12, 'kensaohinrrrrr@gmail.com', 'llskdssfirjg', '$2y$10$yJcmE9sPBg0xCgkUlgjHV.UuyFp9Ezz/fP87Z4OjxgWSYart4yPmG', 'https://in.portal-pokemon.com/assets_c/2017/11/india_apps_Poke%CC%81monGO_logo_02-thumb-650x488-9105.jpg', '1456 5489 5471', 40, NULL, 'member', 'active', '2025-09-01 22:46:48'),
(13, 'ksnsjs@jdjdk.com', 'Jdhdbdbssb', '$2y$10$Ud6j0jq4wwDiOr1by7naoela4m8gzaRrga58BeWd2f2eCxWUp.mZG', 'https://lh3.googleusercontent.com/3Pu9wd7lO3p6WCQpBCZshWRVVpIoW6mwgqgdV_Ra_kWGI_CcywB_01bS28ccYlw8ekaj1LNFmDwTfxKVpN2yppjKuBnlWJgNacRKuIOKUUKrYQ=w1440-e365', '245484040077', 46, NULL, 'member', 'active', '2025-09-01 22:47:28'),
(14, 'yvyccdnj@ububj.com', 'Kamenrider', '$2y$10$pVzLBzIaN/dUtt/eO6SvteKlKTGwsFi1rsCmM2o/jOT1pdzQr0B/q', 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Pokemon_Go.svg/1200px-Pokemon_Go.svg.png', '5636 8855 8887', 28, NULL, 'member', 'active', '2025-09-01 22:48:45');

-- --------------------------------------------------------

--
-- Table structure for table `user_raid_rooms`
--

CREATE TABLE `user_raid_rooms` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('owner','member') NOT NULL DEFAULT 'member',
  `joined_at` datetime NOT NULL,
  `friend_ready` tinyint(1) NOT NULL DEFAULT 0,
  `friend_ready_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_raid_rooms`
--

INSERT INTO `user_raid_rooms` (`id`, `room_id`, `user_id`, `role`, `joined_at`, `friend_ready`, `friend_ready_at`) VALUES
(125, 58, 2, 'owner', '2025-08-31 16:05:13', 0, NULL),
(126, 58, 4, 'member', '2025-08-31 16:06:00', 0, NULL),
(127, 59, 4, 'owner', '2025-08-31 16:22:56', 0, NULL),
(128, 59, 2, 'member', '2025-08-31 16:23:09', 1, '2025-08-31 16:23:10'),
(129, 60, 4, 'owner', '2025-08-31 16:30:10', 0, NULL),
(130, 61, 2, 'owner', '2025-08-31 16:36:51', 0, NULL),
(131, 62, 2, 'owner', '2025-08-31 16:39:24', 0, NULL),
(132, 63, 4, 'owner', '2025-08-31 16:46:55', 0, NULL),
(133, 64, 2, 'owner', '2025-08-31 16:51:36', 0, NULL),
(134, 65, 4, 'owner', '2025-08-31 16:57:48', 0, NULL),
(135, 66, 4, 'owner', '2025-08-31 17:05:15', 0, NULL),
(136, 66, 2, 'member', '2025-08-31 17:17:10', 1, '2025-08-31 17:26:13'),
(137, 67, 4, 'owner', '2025-08-31 18:51:43', 0, NULL),
(138, 67, 2, 'member', '2025-08-31 18:51:53', 1, '2025-08-31 18:51:55'),
(139, 68, 4, 'owner', '2025-08-31 19:00:27', 0, NULL),
(140, 69, 2, 'owner', '2025-08-31 19:14:39', 0, NULL),
(141, 70, 2, 'owner', '2025-08-31 19:24:09', 0, NULL),
(142, 71, 2, 'owner', '2025-08-31 19:30:46', 0, NULL),
(143, 71, 3, 'member', '2025-08-31 19:31:33', 0, NULL),
(144, 72, 2, 'owner', '2025-08-31 19:38:27', 0, NULL),
(145, 73, 4, 'owner', '2025-08-31 19:45:19', 0, NULL),
(146, 73, 2, 'member', '2025-08-31 19:47:25', 0, NULL),
(147, 74, 4, 'owner', '2025-08-31 22:23:29', 0, NULL),
(148, 74, 2, 'member', '2025-08-31 22:25:35', 1, '2025-08-31 22:25:41'),
(149, 75, 4, 'owner', '2025-08-31 23:21:10', 0, NULL),
(150, 76, 2, 'owner', '2025-09-01 01:00:05', 0, NULL),
(151, 75, 2, 'member', '2025-09-01 01:01:34', 1, '2025-09-01 02:20:37'),
(153, 77, 4, 'owner', '2025-09-01 01:38:01', 0, NULL),
(154, 76, 4, 'member', '2025-09-01 02:00:23', 1, '2025-09-01 02:00:38'),
(155, 78, 4, 'owner', '2025-09-01 02:07:35', 0, NULL),
(156, 75, 3, 'member', '2025-09-01 02:13:03', 0, NULL),
(157, 79, 2, 'owner', '2025-09-01 02:20:43', 0, NULL),
(158, 77, 2, 'member', '2025-09-01 02:42:28', 0, NULL),
(159, 78, 2, 'member', '2025-09-01 02:42:32', 0, NULL),
(164, 79, 4, 'member', '2025-09-01 03:17:47', 0, '2025-09-01 03:20:52'),
(165, 80, 2, 'owner', '2025-09-01 19:52:04', 0, NULL),
(167, 80, 4, 'member', '2025-09-01 19:53:07', 1, '2025-09-01 19:53:43'),
(168, 81, 4, 'owner', '2025-09-01 19:54:52', 0, NULL),
(169, 81, 2, 'member', '2025-09-01 19:55:13', 1, '2025-09-01 20:08:26'),
(170, 82, 4, 'owner', '2025-09-01 20:09:58', 0, NULL),
(172, 82, 2, 'member', '2025-09-01 20:10:22', 1, '2025-09-01 20:10:26'),
(173, 83, 4, 'owner', '2025-09-01 20:16:04', 0, NULL),
(174, 83, 2, 'member', '2025-09-01 20:16:08', 1, '2025-09-01 20:21:59'),
(175, 84, 4, 'owner', '2025-09-01 20:24:29', 0, NULL),
(176, 84, 2, 'member', '2025-09-01 20:24:45', 1, '2025-09-01 20:25:16'),
(177, 85, 4, 'owner', '2025-09-01 20:48:31', 0, NULL),
(178, 85, 2, 'member', '2025-09-01 20:48:39', 1, '2025-09-01 20:48:40'),
(179, 86, 2, 'owner', '2025-09-01 20:49:00', 0, NULL),
(180, 86, 4, 'member', '2025-09-01 20:49:06', 0, NULL),
(181, 87, 2, 'owner', '2025-09-01 21:09:46', 0, NULL),
(182, 88, 2, 'owner', '2025-09-01 21:12:16', 0, NULL),
(183, 89, 4, 'owner', '2025-09-01 21:18:11', 0, NULL),
(184, 90, 2, 'owner', '2025-09-01 21:18:43', 0, NULL),
(185, 91, 2, 'owner', '2025-09-01 21:33:14', 0, NULL),
(186, 92, 2, 'owner', '2025-09-01 21:36:39', 0, NULL),
(187, 93, 2, 'owner', '2025-09-01 21:40:42', 0, NULL),
(188, 94, 2, 'owner', '2025-09-01 21:51:36', 0, NULL),
(189, 95, 2, 'owner', '2025-09-01 22:01:48', 0, NULL),
(190, 95, 4, 'member', '2025-09-01 22:01:55', 1, '2025-09-01 22:02:10'),
(191, 96, 4, 'owner', '2025-09-01 22:06:39', 0, NULL),
(192, 96, 2, 'member', '2025-09-01 22:08:00', 0, '2025-09-01 22:25:32'),
(193, 97, 14, 'owner', '2025-09-01 22:53:38', 0, NULL),
(194, 97, 4, 'member', '2025-09-01 22:54:19', 0, '2025-09-01 22:59:04'),
(195, 98, 14, 'owner', '2025-09-01 23:00:02', 0, NULL),
(196, 98, 4, 'member', '2025-09-01 23:00:10', 1, '2025-09-01 23:05:16'),
(197, 99, 4, 'owner', '2025-09-01 23:30:05', 0, NULL),
(198, 99, 14, 'member', '2025-09-01 23:39:12', 0, NULL),
(199, 100, 14, 'owner', '2025-09-01 23:43:48', 0, NULL),
(200, 100, 4, 'member', '2025-09-01 23:44:23', 1, '2025-09-01 23:44:25'),
(201, 101, 14, 'owner', '2025-09-02 00:17:50', 0, NULL),
(202, 101, 1, 'member', '2025-09-02 00:17:54', 1, '2025-09-02 00:47:20'),
(203, 101, 4, 'member', '2025-09-02 00:18:08', 1, '2025-09-02 00:47:07'),
(204, 101, 6, 'member', '2025-09-02 00:19:01', 1, '2025-09-02 00:24:26'),
(205, 101, 7, 'member', '2025-09-02 00:19:21', 1, '2025-09-02 00:41:03'),
(206, 102, 14, 'owner', '2025-09-02 00:57:04', 0, NULL),
(207, 102, 1, 'member', '2025-09-02 00:57:23', 1, '2025-09-02 01:07:16'),
(208, 103, 14, 'owner', '2025-09-03 10:55:15', 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room_id_id` (`raid_rooms_id`,`id`),
  ADD KEY `idx_room_created` (`raid_rooms_id`,`created_at`),
  ADD KEY `fk_chat_user` (`sender`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sent_by` (`sent_by`);

--
-- Indexes for table `raid_boss`
--
ALTER TABLE `raid_boss`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_time` (`start_date`,`end_date`),
  ADD KEY `idx_name` (`pokemon_name`),
  ADD KEY `idx_pid` (`pokemon_id`),
  ADD KEY `pokemon_tier` (`pokemon_tier`);

--
-- Indexes for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_room_user` (`room_id`,`user_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `fk_rr_user` (`user_id`);

--
-- Indexes for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_start_status` (`start_time`,`status`),
  ADD KEY `fk_rooms_owner` (`owner_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `uniq_users_email` (`email`),
  ADD UNIQUE KEY `uniq_users_username` (`username`);

--
-- Indexes for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_room_user` (`room_id`,`user_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `fk_urr_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat`
--
ALTER TABLE `chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `raid_boss`
--
ALTER TABLE `raid_boss`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=209;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `fk_chat_room` FOREIGN KEY (`raid_rooms_id`) REFERENCES `raid_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_user` FOREIGN KEY (`sender`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`sent_by`) REFERENCES `pogopartyth_v1`.`users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `raid_reviews`
--
ALTER TABLE `raid_reviews`
  ADD CONSTRAINT `fk_rr_room` FOREIGN KEY (`room_id`) REFERENCES `raid_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `raid_rooms`
--
ALTER TABLE `raid_rooms`
  ADD CONSTRAINT `fk_rooms_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `pogopartyth_v1`.`users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_raid_rooms`
--
ALTER TABLE `user_raid_rooms`
  ADD CONSTRAINT `fk_urr_room` FOREIGN KEY (`room_id`) REFERENCES `raid_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_urr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
