/**
 * How to get between consecutive stops, keyed "From place|To place".
 *
 * Rebuilt 4 August 2026 for the Wanderlog itinerary.
 *
 * Two rules, both from the master plan's stance on links:
 *
 *  1. Only state what is reliably true. Subway and JR lines are stable and are
 *     named exactly. Kyoto and Nara bus numbers change with the timetable, so
 *     where a route is bus-dependent this says so and leaves the number to the
 *     live Directions link rather than inventing one that is wrong by
 *     September.
 *  2. Distances are NOT here. The seed computes them from the coordinates, so
 *     they cannot drift out of step when something moves in the itinerary.
 *
 * Anything not listed and under 1.2 km straight-line falls back to a plain
 * walk with a time estimated from the distance. Anything unlisted and further
 * gets no leg at all — the directions link still works.
 */

export type LegMode = 'walk' | 'subway' | 'train' | 'bus' | 'taxi' | 'mixed'

export type SeedLeg = {
  mode: LegMode
  detail: string
  /** Curated for transit. Walks are derived from distance if omitted. */
  durationMin?: number
}

export const LEGS: Record<string, SeedLeg> = {
  // ── Day 1 · Osaka ──────────────────────────────────────────────────────
  'Nankai Namba Station|Kuromon Ichiba Market': {
    mode: 'walk',
    detail: 'East from Namba along Sennichimae. The market entrance is on Sakaisuji.',
    durationMin: 10,
  },
  'Kuromon Ichiba Market|Dormy Inn Premium Namba Natural Hot Spring': {
    mode: 'walk',
    detail: 'Seven minutes north into Shimanouchi.',
    durationMin: 7,
  },
  "Dormy Inn Premium Namba Natural Hot Spring|Gold's Gym Shinsaibashi": {
    mode: 'walk',
    detail: 'North up Sakaisuji to Shinsaibashi. BIG STEP 6F.',
    durationMin: 8,
  },
  "Gold's Gym Shinsaibashi|Hozenji Yokocho": {
    mode: 'walk',
    detail: 'South through the Shinsaibashi arcade toward Dotonbori.',
    durationMin: 10,
  },
  'Hozenji Yokocho|Dotonbori': {
    mode: 'walk',
    detail: 'The yokocho opens straight onto the canal. Two minutes.',
    durationMin: 2,
  },
  'Dotonbori|Dormy Inn Premium Namba Natural Hot Spring': {
    mode: 'walk',
    detail: 'Three minutes. This is the whole point of the Namba base.',
    durationMin: 4,
  },

  // ── Day 2 · Taima-dera and Tennoji ─────────────────────────────────────
  'Taimadera Station|Taima-dera': {
    mode: 'walk',
    detail: 'West from the station, uphill toward the mountains. Signposted.',
    durationMin: 15,
  },
  'Tennoji Station|Shitennō-ji': {
    mode: 'walk',
    detail: 'North up Tanimachi-suji, or one stop on the Tanimachi line to Shitennoji-mae Yuhigaoka.',
    durationMin: 12,
  },
  'Shitennō-ji|Isshin-ji': {
    mode: 'walk',
    detail: 'South-west through the temple district, past Chausuyama.',
    durationMin: 10,
  },
  'Isshin-ji|Tsutenkaku Hondori Shopping Street': {
    mode: 'walk',
    detail: 'South-west into Shinsekai — the tower is the landmark, you cannot miss it.',
    durationMin: 12,
  },
  "Tsutenkaku Hondori Shopping Street|Gold's Gym Shinsaibashi": {
    mode: 'subway',
    detail:
      'Sakaisuji line, Ebisucho → Nagahoribashi, 3 stops, then 5 min on foot. Or Midosuji from Dobutsuen-mae via Namba.',
    durationMin: 20,
  },
  "Gold's Gym Shinsaibashi|Dormy Inn Premium Namba Natural Hot Spring": {
    mode: 'walk',
    detail: 'South back into Shimanouchi.',
    durationMin: 8,
  },

  // ── Day 3 · Osaka → Arima ──────────────────────────────────────────────
  'Dormy Inn Premium Namba Natural Hot Spring|Hankyu Sanbangai depachika, Umeda': {
    mode: 'subway',
    detail:
      'Midosuji line, Namba → Umeda, 3 stops. The bus terminal is on 1F of Hankyu Sanbangai: from the 2F central gate, down the stairs, then the narrow street left in front of Kinokuniya toward the Chayamachi exit.',
    durationMin: 25,
  },
  'Arima Onsen Tocen Goshobo|Arima Onsen old town': {
    mode: 'walk',
    detail: 'Up Yumotozaka from the river. Goshobo sits at the bottom of it.',
    durationMin: 4,
  },
  'Arima Onsen old town|Tenjin Hot Spring Source': {
    mode: 'walk',
    detail: 'A minute off Yumotozaka, behind Tenjin shrine.',
    durationMin: 2,
  },
  'Tenjin Hot Spring Source|Arima Toys and Automata Museum': {
    mode: 'walk',
    detail: 'Back onto the main street, beside the Kin no Yu bathhouse.',
    durationMin: 3,
  },
  'Arima Toys and Automata Museum|Gosho Hot Spring Source': {
    mode: 'walk',
    detail: 'A couple of lanes up from the main street.',
    durationMin: 4,
  },
  'Gosho Hot Spring Source|Onsen-ji': {
    mode: 'walk',
    detail: 'Up the steps on the east side of the old town. Nenbutsu-ji is next door.',
    durationMin: 5,
  },
  'Onsen-ji|Nenbutsu-ji': {
    mode: 'walk',
    detail: 'Immediately adjacent — the two share the same slope.',
    durationMin: 2,
  },
  'Nenbutsu-ji|Gokuraku Hot Spring Source': {
    mode: 'walk',
    detail: 'Downhill past Gokuraku-ji. The third and last of the springheads.',
    durationMin: 3,
  },
  'Gokuraku Hot Spring Source|Gin no Yu': {
    mode: 'walk',
    detail: 'South-west, five minutes down. The clear ginsen bath.',
    durationMin: 6,
  },
  'Gin no Yu|Kin no Yu': {
    mode: 'walk',
    detail: 'Back up into the centre. The two are a five-minute walk apart.',
    durationMin: 6,
  },
  'Kin no Yu|Arima Onsen Tocen Goshobo': {
    mode: 'walk',
    detail: 'Two minutes downhill to the river.',
    durationMin: 3,
  },

  // ── Day 4 · Arima ──────────────────────────────────────────────────────
  'Arima Onsen Tocen Goshobo|Arima Taiko no Yu': {
    mode: 'walk',
    detail:
      'Uphill, ~7 min from Arima Onsen Station. There is a free shuttle from the station if the legs have gone.',
    durationMin: 12,
  },
  'Arima Taiko no Yu|Arima Onsen old town': {
    mode: 'walk',
    detail: 'Back down into the town centre.',
    durationMin: 9,
  },
  'Arima Onsen old town|Arima Onsen Tocen Goshobo': {
    mode: 'walk',
    detail: 'Back downhill to the river.',
    durationMin: 4,
  },

  // ── Day 5 · Arima → Kyoto ──────────────────────────────────────────────
  'Kyoto Station|Dormy Inn Premium Kyoto Ekimae Natural Hot Spring': {
    mode: 'walk',
    detail: 'Three minutes, beside Kyoto Tower. Karasuma side.',
    durationMin: 4,
  },
  "Dormy Inn Premium Kyoto Ekimae Natural Hot Spring|Gold's Gym Kyoto Nijo": {
    mode: 'train',
    detail:
      'JR Sagano (San-in) line, Kyoto → Nijo, 2 stops, ~5 min. The gym is inside the station building, NK Bldg 2F — no walk at the far end.',
    durationMin: 12,
  },
  "Gold's Gym Kyoto Nijo|Nishiki Market": {
    mode: 'subway',
    detail:
      'Tozai line, Nijo → Karasuma Oike, then the Karasuma line one stop to Shijo. Or JR back to Kyoto and the Karasuma line north — same time either way.',
    durationMin: 20,
  },
  'Nishiki Market|Teramachi Shopping Arcade': {
    mode: 'walk',
    detail: 'The arcades run straight off the east end of Nishiki.',
    durationMin: 4,
  },
  'Teramachi Shopping Arcade|Takase River': {
    mode: 'walk',
    detail: 'East to Kiyamachi. The canal runs parallel, one street back from the Kamogawa.',
    durationMin: 6,
  },

  // ── Day 6 · East Kyoto ─────────────────────────────────────────────────
  'Inari Station|Fushimi Inari Taisha': {
    mode: 'walk',
    detail: 'The JR platform faces the shrine approach. You are there.',
    durationMin: 2,
  },
  'Fushimi Inari Taisha|Sannenzaka': {
    mode: 'mixed',
    detail:
      'JR Nara line Inari → Tofukuji, change to the Keihan line → Kiyomizu-Gojo, then ~15 min uphill on foot. A bus runs it too, but the number varies by timetable — check the live directions.',
    durationMin: 35,
  },
  'Sannenzaka|Kiyomizu-dera': {
    mode: 'walk',
    detail: 'Straight up the stone steps. This IS the walk — do not shortcut it.',
    durationMin: 8,
  },
  'Kiyomizu-dera|Ninenzaka': {
    mode: 'walk',
    detail: 'Back down Sannenzaka and on to the lower slope.',
    durationMin: 10,
  },
  'Ninenzaka|Kōdai-ji': {
    mode: 'walk',
    detail: 'North at the bottom of the slope. The entrance is up a short flight of steps.',
    durationMin: 6,
  },
  'Kōdai-ji|Gion': {
    mode: 'walk',
    detail:
      'Down through Maruyama Park and west along Shijo. Kennin-ji is at the southern end of Hanamikoji.',
    durationMin: 12,
  },
  'Gion|Chion-in': {
    mode: 'walk',
    detail: 'North past Yasaka Shrine and through Maruyama Park. The Sanmon is unmistakable.',
    durationMin: 13,
  },
  'Chion-in|Gion': {
    mode: 'walk',
    detail: 'Back the way you came, south through the park.',
    durationMin: 13,
  },
  "Gion|Gold's Gym Kyoto Nijo": {
    mode: 'subway',
    detail:
      'Tozai line, Higashiyama → Nijo, direct, ~10 min. The gym is inside the station building.',
    durationMin: 18,
  },

  // ── Day 7 · Nara ───────────────────────────────────────────────────────
  'Kintetsu Nara Station|Kasuga Taisha': {
    mode: 'walk',
    detail:
      'East through Nara Park along the lantern-lined approach, ~25 min and pleasant. Buses run it if the heat is winning — the number varies, check the live directions.',
    durationMin: 25,
  },
  'Kasuga Taisha|Nara Park': {
    mode: 'walk',
    detail: 'Back west. The deer find you long before the park boundary does.',
    durationMin: 10,
  },
  'Nara Park|Tōdai-ji': {
    mode: 'walk',
    detail: 'North through the park to the Nandaimon gate.',
    durationMin: 8,
  },
  'Tōdai-ji|Nakatanidou': {
    mode: 'walk',
    detail:
      'South-west out of the park to Sanjo-dori. Time the arrival around a mochi pounding if you can.',
    durationMin: 20,
  },
  "Kyoto Station|Gold's Gym Kyoto Nijo": {
    mode: 'train',
    detail: 'JR Sagano line, Kyoto → Nijo, 2 stops. The gym is in the station building.',
    durationMin: 12,
  },

  // ── Day 8 · Departure ──────────────────────────────────────────────────
  'Dormy Inn Premium Kyoto Ekimae Natural Hot Spring|Kyoto Station Porta': {
    mode: 'walk',
    detail: 'Porta is the underground mall directly beneath the station plaza.',
    durationMin: 4,
  },
  'Kyoto Station Porta|Kyoto Ramen Koji': {
    mode: 'walk',
    detail: 'Up to the 10th floor of the station building — the escalators from the west concourse.',
    durationMin: 8,
  },
  'Kyoto Ramen Koji|Dormy Inn Premium Kyoto Ekimae Natural Hot Spring': {
    mode: 'walk',
    detail: 'Back down and across. Three minutes each way for the bag.',
    durationMin: 5,
  },
}
