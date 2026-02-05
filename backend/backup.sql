-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: smart_barangay
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','citizen') DEFAULT 'citizen',
  `status` enum('pending','approve','reject') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@barangay.com','admin123','admin','approve','2026-01-30 12:33:04','2026-01-30 12:33:04'),(2,'Juan Dela Cruz','juan@email.com','citizen123','citizen','approve','2026-01-30 12:33:04','2026-01-30 12:33:04'),(3,'Maria Santos','maria@email.com','maria123','citizen','approve','2026-01-30 12:33:04','2026-02-04 04:48:59'),(4,'Pedro Reyes','pedro@email.com','pedro123','citizen','approve','2026-01-30 12:33:04','2026-01-30 12:33:04'),(5,'Ana Lopez','ana@email.com','ana123','citizen','reject','2026-01-30 12:33:04','2026-01-30 12:33:04'),(6,'Test Citizen','citizen@test.com','password123','citizen','approve','2026-01-30 14:28:34','2026-01-30 14:28:34'),(7,'Test Admin','admin@test.com','admin123','admin','approve','2026-01-30 14:28:34','2026-01-30 14:28:34'),(8,'cad','bheaasuncion@gmail.com','123','citizen','approve','2026-01-31 04:44:44','2026-02-02 14:06:25'),(18,'dawd','marga@gmail.com','123123','citizen','reject','2026-01-31 07:34:49','2026-02-04 03:30:39'),(24,'bea','bhea@gmail.com','abcd','citizen','reject','2026-01-31 12:21:30','2026-02-04 03:30:19'),(26,'Beatriz','bhea@email.com','test123','citizen','approve','2026-02-01 04:41:35','2026-02-01 04:41:35'),(27,'Mariz Asuncion','Mariz@gmail.com','112003','citizen','approve','2026-02-02 14:44:38','2026-02-02 14:48:44'),(29,'try ulit','bean@gmail.com','12345','citizen','approve','2026-02-02 14:48:19','2026-02-04 03:25:12'),(30,'Inday Bakery','indayako@email.com','123123','citizen','pending','2026-02-04 04:49:39','2026-02-04 04:49:39');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-05 16:09:00
