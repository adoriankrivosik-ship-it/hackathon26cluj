-- Immutable hash-chained audit ledger for project changes

CREATE TABLE IF NOT EXISTS audit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_label TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  prev_hash TEXT NOT NULL,
  data_hash TEXT NOT NULL
);

-- Seed: realistic status progressions with valid hash chain
-- data_hash = SHA-256(prev_hash + timestamp + user_id + action + entity_id + new_value)

INSERT INTO audit_ledger (
  id, timestamp, user_id, user_label, action, entity_type, entity_id,
  field_changed, old_value, new_value, prev_hash, data_hash
) VALUES
(
  1,
  '2025-11-10T09:15:00.000Z',
  'usr_admin_01',
  'Admin Cluj',
  'CREATE',
  'project',
  'pasarela-manastur-2026',
  NULL,
  NULL,
  'Pasarela pietonală Mănăștur',
  'GENESIS',
  '1fa9e84a9fa48487374be33738953a095b71f014f297a7d100bf68f06e7b680a'
),
(
  2,
  '2025-12-01T14:30:00.000Z',
  'usr_admin_01',
  'Admin Cluj',
  'UPDATE_STATUS',
  'project',
  'pasarela-manastur-2026',
  'status',
  'planned',
  'procurement',
  '1fa9e84a9fa48487374be33738953a095b71f014f297a7d100bf68f06e7b680a',
  'c892ced07aef956efb7195b823475e297722047add6c5cf1fe1556d7547aa04f'
),
(
  3,
  '2026-01-15T11:00:00.000Z',
  'usr_func_02',
  'Func. Ionescu',
  'UPDATE_STATUS',
  'project',
  'pasarela-manastur-2026',
  'status',
  'procurement',
  'continuing',
  'c892ced07aef956efb7195b823475e297722047add6c5cf1fe1556d7547aa04f',
  'f0c50bb68a2edc035fc1113aada8fdfa02953f25ea20427bf9172e0075b30fa3'
),
(
  4,
  '2026-02-20T16:45:00.000Z',
  'usr_admin_01',
  'Admin Cluj',
  'UPDATE_STATUS',
  'project',
  'piata-mihai-viteazu-2026',
  'status',
  'continuing',
  'finalizing',
  'f0c50bb68a2edc035fc1113aada8fdfa02953f25ea20427bf9172e0075b30fa3',
  'a49dc63cc48ef0aed70e842988290fb38bf0cba5a23467c4b39f6337e190deb3'
),
(
  5,
  '2026-03-05T10:20:00.000Z',
  'usr_func_03',
  'Func. Popescu',
  'UPDATE_DETAILS',
  'project',
  'scoala-11-rehab-2026',
  'budget_ron',
  '4200000',
  '4500000',
  'a49dc63cc48ef0aed70e842988290fb38bf0cba5a23467c4b39f6337e190deb3',
  '1c721a042a3c742636ab2f925f564f420b1f76703c451b5e8f5086b907522896'
),
(
  6,
  '2026-03-18T08:00:00.000Z',
  'usr_admin_01',
  'Admin Cluj',
  'UPDATE_STATUS',
  'project',
  'piste-floresti-2026',
  'status',
  'planned',
  'procurement',
  '1c721a042a3c742636ab2f925f564f420b1f76703c451b5e8f5086b907522896',
  '5ff5ca3fa38749a30b8f12782837406dfed3148a4ce1bf348f418608649cddf6'
);
