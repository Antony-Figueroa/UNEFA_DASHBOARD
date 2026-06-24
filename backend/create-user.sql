-- Create user 00000000 / Admin123!
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "t_persons" ("CI", "FIRST_NAME", "FIRST_SURNAME", "GENDER", "EMAIL", "STATUS")
SELECT '00000000', 'ADMIN', 'SISTEMA', 'M', 'admin@sistema.com', 1
WHERE NOT EXISTS (SELECT 1 FROM "t_persons" WHERE "CI" = '00000000');

INSERT INTO "t_user" ("USER_CI", "NAME", "EMAIL", "PASSWORD", "STATUS", "person_id")
SELECT
  '00000000',
  'ADMIN SISTEMA',
  'admin@sistema.com',
  crypt('Admin123!', gen_salt('bf', 10)),
  1,
  (SELECT "person_id" FROM "t_persons" WHERE "CI" = '00000000')
WHERE NOT EXISTS (SELECT 1 FROM "t_user" WHERE "USER_CI" = '00000000');

-- Verify
SELECT u."USER_ID", u."USER_CI", u."NAME"
FROM "t_user" u
WHERE u."USER_CI" = '00000000';
