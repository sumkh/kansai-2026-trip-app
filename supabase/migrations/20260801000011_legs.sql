-- How you get from the previous activity to this one.
--
-- Columns on activities rather than a legs table: there is exactly 0..1 leg per
-- activity — the hop that delivers you to it — so a join would buy nothing and
-- cost a query on the day view, which has to render offline.
--
-- Distance is stored in metres and computed from the coordinates at seed time,
-- not hand-entered. Hand-entered distances go stale the moment a place moves in
-- the itinerary, and nobody notices.

alter table activities add column arrive_mode text;          -- walk | subway | train | bus | taxi
alter table activities add column arrive_detail text;        -- 'Karasuma line, Kyoto → Shijo, 2 stops'
alter table activities add column arrive_distance_m int;     -- straight-line, from lat/lng
alter table activities add column arrive_duration_min int;

-- Where the previous stop was, so the day view can build a directions link that
-- routes FROM there rather than from wherever the phone happens to be standing.
alter table activities add column arrive_from_name text;
alter table activities add column arrive_from_lat double precision;
alter table activities add column arrive_from_lng double precision;
