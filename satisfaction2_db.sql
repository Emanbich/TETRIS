-- First, connect to MySQL/MariaDB and create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS satisfaction_db;
USE satisfaction_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT NOT NULL AUTO_INCREMENT,
    question_text TEXT NOT NULL,
    question_type ENUM('rating', 'stars', 'choice', 'text') NOT NULL,
    max_value INT DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    user_id INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT surveys_ibfk_1 
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
    id INT NOT NULL AUTO_INCREMENT,
    survey_id INT NOT NULL,
    question_id INT NOT NULL,
    answer TEXT NOT NULL,
    user_id INT DEFAULT NULL,
    responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    nlp_analysis JSON,
    PRIMARY KEY (id),
    KEY survey_id (survey_id),
    KEY question_id (question_id),
    CONSTRAINT responses_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
    CONSTRAINT responses_ibfk_2 FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
    CONSTRAINT responses_ibfk_3 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Clear existing questions to avoid duplicates
TRUNCATE TABLE questions;

-- Insert the predefined questions (without specifying IDs)
INSERT INTO questions (question_text, question_type, max_value) VALUES
("Recommanderiez-vous notre service à d'autres courtiers ?", 'rating', 10),
("Quel est votre niveau de satisfaction globale concernant nos services ?", 'stars', 5),
("Comment évaluez-vous la rapidité de nos réponses à vos demandes ?", 'choice', NULL),
("Les solutions d'assurance proposées correspondent-elles à vos besoins ?", 'choice', NULL),
("Comment jugez-vous la clarté des informations fournies ?", 'choice', NULL),
("Le processus de soumission des dossiers est-il simple à utiliser ?", 'choice', NULL),
("Les délais de traitement des dossiers sont-ils respectés ?", 'choice', NULL),
("Comment évaluez-vous le support technique fourni ?", 'choice', NULL),
("La tarification proposée est-elle compétitive ?", 'choice', NULL),
("Avez-vous des suggestions d'amélioration ou des commentaires ?", 'text', NULL);