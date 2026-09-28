---
name: daily-brief
description: A short brief for tomorrow — the plan, the weather, what needs booking, and anything time-critical. Use in the evening during the trip, or the morning of.
---

# Daily brief

Read for the target day (default: tomorrow, Asia/Tokyo):

1. The `days` row — title, summary, base city.
2. Its `activities` in order, with `start_time`, `type` and `status`.
3. The `is_selected` transport option for each TRANSPORT activity.
4. Any `checklist_items` due on or before that date and not yet done —
   `is_blocking` ones first.
5. Any `notes` from the previous day that affect it.

Then check the weather for the base city.

## Output

Keep it short enough to read on a phone screen without scrolling much.

- **One line** on what the day is.
- **The first move** — what time to leave and how, by name.
- **Weather** in one line, with a practical consequence if there is one
  (rain means the Arashiyama morning is a washout; 31°C means carry water).
- **Anything time-critical**, called out. Overdue blocking checklist items,
  a booking window closing, a bath that is shut that day.
- **Dinner** — where, and whether it is booked.

No preamble, no restating the whole itinerary. If nothing is time-critical,
say so in three words rather than padding the section.
