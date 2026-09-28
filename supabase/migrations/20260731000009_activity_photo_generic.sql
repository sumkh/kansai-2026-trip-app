-- Activities can carry a representative photo too — "Lunch in Arima town" is
-- illustrated with soba, not with a photo of that specific restaurant, because
-- Soba Dosanjin has no article of its own.
--
-- The flag exists so the card can say so. Showing a stock bowl of soba as if it
-- were the shop is the kind of small dishonesty that erodes trust in every
-- other picture in the app.

alter table activities add column photo_is_generic boolean not null default false;
