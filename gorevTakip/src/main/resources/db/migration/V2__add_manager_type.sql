-- V2__add_manager_type.sql
-- Kullanıcı tablosuna manager_type sütunu ekleme

ALTER TABLE users ADD COLUMN manager_type VARCHAR(255);

-- Mevcut müdürlere varsayılan değer atama
UPDATE users SET manager_type = 'Genel Müdür' WHERE role = 'MANAGER' AND manager_type IS NULL; 