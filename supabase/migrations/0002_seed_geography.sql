-- =============================================================================
-- Abyss — Geography seed
--
-- Seeds wilayas from the app's delivery territory data (lib/wilayas.ts).
-- Algeria has 69 wilayas under the November 2025 territorial reform
-- (58 classic + 11 new, codes 59–69 per the widely circulated assignment).
--
-- NOTE — communes: only the communes already used by the checkout flow are
-- seeded below. Import the full official list (~1541 communes) before going
-- live; this file remains a working superset for the demo.
-- =============================================================================

-- Wilayas ---------------------------------------------------------------------
insert into public.wilayas (id, code, name_fr, name_en) values
  (1, 1, 'Adrar', 'Adrar'),
  (2, 2, 'Chlef', 'Chlef'),
  (3, 3, 'Laghouat', 'Laghouat'),
  (4, 4, 'Oum El Bouaghi', 'Oum El Bouaghi'),
  (5, 5, 'Batna', 'Batna'),
  (6, 6, 'Béjaïa', 'Bejaia'),
  (7, 7, 'Biskra', 'Biskra'),
  (8, 8, 'Béchar', 'Bechar'),
  (9, 9, 'Blida', 'Blida'),
  (10, 10, 'Bouira', 'Bouira'),
  (11, 11, 'Tamanrasset', 'Tamanrasset'),
  (12, 12, 'Tébessa', 'Tebessa'),
  (13, 13, 'Tlemcen', 'Tlemcen'),
  (14, 14, 'Tiaret', 'Tiaret'),
  (15, 15, 'Tizi Ouzou', 'Tizi Ouzou'),
  (16, 16, 'Alger', 'Algiers'),
  (17, 17, 'Djelfa', 'Djelfa'),
  (18, 18, 'Jijel', 'Jijel'),
  (19, 19, 'Sétif', 'Setif'),
  (20, 20, 'Saïda', 'Saida'),
  (21, 21, 'Skikda', 'Skikda'),
  (22, 22, 'Sidi Bel Abbès', 'Sidi Bel Abbes'),
  (23, 23, 'Annaba', 'Annaba'),
  (24, 24, 'Guelma', 'Guelma'),
  (25, 25, 'Constantine', 'Constantine'),
  (26, 26, 'Médéa', 'Medea'),
  (27, 27, 'Mostaganem', 'Mostaganem'),
  (28, 28, 'M''sila', 'Msila'),
  (29, 29, 'Mascara', 'Mascara'),
  (30, 30, 'Ouargla', 'Ouargla'),
  (31, 31, 'Oran', 'Oran'),
  (32, 32, 'El Bayadh', 'El Bayadh'),
  (33, 33, 'Illizi', 'Illizi'),
  (34, 34, 'Bordj Bou Arréridj', 'Bordj Bou Arreridj'),
  (35, 35, 'Boumerdès', 'Boumerdes'),
  (36, 36, 'El Tarf', 'El Tarf'),
  (37, 37, 'Tindouf', 'Tindouf'),
  (38, 38, 'Tissemsilt', 'Tissemsilt'),
  (39, 39, 'El Oued', 'El Oued'),
  (40, 40, 'Khenchela', 'Khenchela'),
  (41, 41, 'Souk Ahras', 'Souk Ahras'),
  (42, 42, 'Tipaza', 'Tipaza'),
  (43, 43, 'Mila', 'Mila'),
  (44, 44, 'Aïn Defla', 'Ain Defla'),
  (45, 45, 'Naâma', 'Naama'),
  (46, 46, 'Aïn Témouchent', 'Ain Temouchent'),
  (47, 47, 'Ghardaïa', 'Ghardaia'),
  (48, 48, 'Relizane', 'Relizane'),
  (49, 49, 'Timimoun', 'Timimoun'),
  (50, 50, 'Bordj Badji Mokhtar', 'Bordj Badji Mokhtar'),
  (51, 51, 'Ouled Djellal', 'Ouled Djellal'),
  (52, 52, 'Béni Abbès', 'Beni Abbes'),
  (53, 53, 'In Salah', 'In Salah'),
  (54, 54, 'In Guezzam', 'In Guezzam'),
  (55, 55, 'Touggourt', 'Touggourt'),
  (56, 56, 'Djanet', 'Djanet'),
  (57, 57, 'El M''Ghair', 'El Mghair'),
  (58, 58, 'El Meniaa', 'El Meniaa'),
  (59, 59, 'Aflou', 'Aflou'),
  (60, 60, 'El Abiodh Sidi Cheikh', 'El Abiodh Sidi Cheikh'),
  (61, 61, 'El Aricha', 'El Aricha'),
  (62, 62, 'El Kantara', 'El Kantara'),
  (63, 63, 'Barika', 'Barika'),
  (64, 64, 'Bou Saada', 'Bou Saada'),
  (65, 65, 'Bir El Ater', 'Bir El Ater'),
  (66, 66, 'Ksar El Boukhari', 'Ksar El Boukhari'),
  (67, 67, 'Ksar Chellala', 'Ksar Chellala'),
  (68, 68, 'Aïn Oussara', 'Ain Oussara'),
  (69, 69, 'Messaad', 'Messaad')
on conflict (id) do nothing;

-- Communes (checkout working set) ----------------------------------------------
-- Algiers (wilaya 16)
insert into public.communes (id, wilaya_id, name_fr, name_en) values
  (1, 16, 'Hydra', 'Hydra'),
  (2, 16, 'Sidi Yahia / Saïd Hamdine', 'Sidi Yahia / Said Hamdine'),
  (3, 16, 'El Biar', 'El Biar'),
  (4, 16, 'Dely Brahim', 'Dely Brahim'),
  (5, 16, 'Ben Aknoun', 'Ben Aknoun'),
  (6, 16, 'Kouba', 'Kouba'),
  (7, 16, 'Bab Ezzouar', 'Bab Ezzouar'),
  (8, 16, 'Alger Centre', 'Algiers Centre')
on conflict (id) do nothing;

-- Oran (wilaya 31)
insert into public.communes (id, wilaya_id, name_fr, name_en) values
  (9, 31, 'Oran Centre / Front de Mer', 'Oran Centre / Sea Front'),
  (10, 31, 'Akid Lotfi', 'Akid Lotfi'),
  (11, 31, 'Es Sénia', 'Es Senia'),
  (12, 31, 'Bir El Djir', 'Bir El Djir')
on conflict (id) do nothing;

-- Constantine (wilaya 25) — hub boutique
insert into public.communes (id, wilaya_id, name_fr, name_en) values
  (13, 25, 'Constantine Centre', 'Constantine Centre'),
  (14, 25, 'El Khroub', 'El Khroub')
on conflict (id) do nothing;

-- Batna (wilaya 5) — referenced by the store's demo live feed
insert into public.communes (id, wilaya_id, name_fr, name_en) values
  (15, 5, 'Batna Centre', 'Batna Centre')
on conflict (id) do nothing;

-- NOTE: extend `public.communes` with the full official Algerian commune list
-- (~1541 rows) via a proper data import before production. This seed only
-- guarantees the checkout dropdown has data for the demo hubs.