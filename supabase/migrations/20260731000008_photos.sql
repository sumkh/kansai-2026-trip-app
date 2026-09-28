-- Reference photos for sites, restaurants and itinerary activities.
--
-- These are NOT the `photos` table — that one is for pictures the travellers
-- take, and remains unbuilt. These are one representative image per place,
-- fetched from Wikimedia and committed to public/photos/ so they are:
--   - same origin, so the service worker caches them like any other asset
--   - downloaded once on wifi, then free for the rest of the trip
--
-- Only the filename is stored. The bytes live in the repo, which keeps the
-- database small and means an image can never 404 against a stale row.

alter table sites add column photo_file text;
alter table sites add column photo_credit text;
alter table sites add column photo_license text;
alter table sites add column photo_source text;

alter table restaurants add column photo_file text;
alter table restaurants add column photo_credit text;
alter table restaurants add column photo_license text;
alter table restaurants add column photo_source text;
-- True when the image shows the dish or category rather than that exact shop.
-- Small independents have no article of their own, and a photo of takoyaki is
-- genuinely useful next to a takoyaki stall — but it must not imply "this is
-- what that shop looks like".
alter table restaurants add column photo_is_generic boolean not null default false;

alter table activities add column photo_file text;
alter table activities add column photo_credit text;
