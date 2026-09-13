-- Dev seed (dev profile only): one admin user admin / admin (ROLE_ADMIN).
-- The password_hash is a BCrypt digest of the literal string "admin", generated
-- at build time. Remove or re-hash this row before running in production.
INSERT INTO users (username, password_hash, role)
SELECT 'admin', '$2a$10$3EW/Rmp13koG8giQqtzYwOClJiAq5VRdTkZTktdlDzGMobsBzPA6G', 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
