-- Gyms, from master plan section 8.
--
-- They belong in the Site Index rather than as a separate table: a gym is
-- somewhere you might go, which is exactly what a site is. The only thing
-- missing was a kind and a way to mark one as avoid.
--
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction that adds it,
-- which is why nothing here inserts a GYM row — seeding is a separate step.

alter type site_kind add value if not exists 'GYM';

-- Anytime Fitness Sanjokarasuma: multiple reviewers report hostility toward
-- foreign visitors, including threats against their home-country membership.
-- 3.3 against 4.5 at the Shijo-Kawaramachi branch a few minutes away.
--
-- Recorded as data for the same reason Gekkoen is on the restaurant side: so it
-- cannot be rediscovered as a reasonable idea at 21:00 by someone looking at a
-- map and picking the nearest pin.
alter table sites add column is_avoid boolean not null default false;
