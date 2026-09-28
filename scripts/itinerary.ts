/**
 * The trip, as data.
 *
 * Rebuilt on 4 August 2026 from Brian's Wanderlog itinerary, and this file is
 * now the source of the day-by-day: section 5 of
 * docs/KANSAI-2026-MASTER-PLAN.md is generated from it by `npm run plan:sync`.
 * Change the schedule here, regenerate, and the two cannot drift. The plan is
 * still the source for hotels, transport rules, the food guide, the gym
 * research and the Arima dining problem.
 *
 * This file is meant to be READ. Everything downstream inherits its mistakes,
 * so keep it flat, obvious and easy to diff.
 *
 * Times are local Asia/Tokyo, 'HH:MM'. Costs are JPY, per person unless noted.
 */

export type ActivityType =
  | 'TRANSPORT' | 'ONSEN' | 'FOOD' | 'SIGHT' | 'SHOPPING' | 'LODGING' | 'ADMIN'

export type SeedTransportOption = {
  label: string
  mode: string
  duration_min: number
  cost_jpy?: number
  from_place?: string
  to_place?: string
  notes?: string
  /** At most one per activity. */
  is_selected?: boolean
}

export type SeedActivity = {
  order: number
  start_time?: string
  duration_min?: number
  title: string
  description?: string
  type: ActivityType
  place_name?: string
  address?: string
  lat?: number
  lng?: number
  is_booked?: boolean
  booking_ref?: string
  cost_jpy?: number
  transport_options?: SeedTransportOption[]
}

export type SeedDay = {
  date: string
  day_number: number
  title: string
  summary: string
  base_city: string
  activities: SeedActivity[]
}

export type SeedChecklistItem = {
  title: string
  detail?: string
  category: 'booking' | 'dining' | 'transport' | 'admin' | 'packing' | 'verify'
  due_date?: string
  is_blocking?: boolean
}

export const TRIP = {
  name: 'Kansai 2026',
  start_date: '2026-09-19',
  end_date: '2026-09-26',
}

// Booking references. PINs from the Trip.com vouchers are deliberately NOT
// stored — the vouchers mark them "do not disclose", and the app has no use for
// them. They live on the vouchers.
const NAMBA_REF = '1000000000000001'
const KYOTO_REF = '1000000000000003'
const GOSHOBO_REF = '1000000000000002'

export const DAYS: SeedDay[] = [
  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-19',
    day_number: 1,
    title: 'Arrival, Osaka',
    summary:
      'Land 09:10 after a red-eye. Kuromon Market, check in, a first gym session, then Hozen-ji and Dotonbori after dark.',
    base_city: 'Osaka',
    activities: [
      {
        order: 1,
        start_time: '01:25',
        duration_min: 405,
        title: 'MM774 Peach · SIN T2 → KIX T2',
        description: 'Departs Singapore 01:25, lands Kansai 09:10. Booked.',
        type: 'TRANSPORT',
        place_name: 'Singapore Changi Airport Terminal 2',
        lat: 1.3554, lng: 103.9878,
        is_booked: true,
        booking_ref: 'ABC123',
      },
      {
        order: 2,
        start_time: '09:10',
        duration_min: 50,
        title: 'Immigration at KIX T2, then free shuttle to T1',
        description:
          'Budget 60–90 min on a holiday Saturday, so this may run long. The T2 → T1 shuttle bus is free and takes about 10 min.',
        type: 'ADMIN',
        place_name: 'Kansai International Airport Terminal 2',
        lat: 34.4273, lng: 135.2325,
      },
      {
        order: 3,
        start_time: '10:00',
        duration_min: 60,
        title: 'KIX → Namba',
        description:
          'Nankai from KIX Terminal 1. Faster, cheaper and simpler than the Haruka for a Namba base.',
        type: 'TRANSPORT',
        place_name: 'Nankai Namba Station',
        lat: 34.6656, lng: 135.5010,
        transport_options: [
          {
            label: 'Nankai Airport Express',
            mode: 'train',
            duration_min: 45,
            cost_jpy: 970,
            from_place: 'KIX Terminal 1',
            to_place: 'Nankai Namba',
            notes: 'Buy at KIX. Unreserved. The default choice.',
            is_selected: true,
          },
          {
            label: 'Nankai Rapi:t',
            mode: 'train',
            duration_min: 38,
            cost_jpy: 1490,
            from_place: 'KIX Terminal 1',
            to_place: 'Nankai Namba',
            notes: 'Reserved seats, luggage space, 7 min faster for ¥520 more.',
          },
        ],
      },
      {
        order: 4,
        start_time: '11:30',
        duration_min: 210,
        title: 'Kuromon Ichiba Market',
        description:
          'Seven minutes on foot from the hotel. Stalls grill to order — scallops in the shell, otoro, uni, skewers. Eat standing up; that is the point. A long slot because check-in is not until 15:00 and you are carrying only a backpack.',
        type: 'FOOD',
        place_name: 'Kuromon Ichiba Market',
        lat: 34.6653, lng: 135.5063,
        cost_jpy: 3000,
      },
      {
        order: 5,
        start_time: '15:00',
        duration_min: 60,
        title: 'Check in at Dormy Inn Premium Namba',
        description:
          'Natural Hot Spring Yugiri no Yu. One double room, 2 nights, prepaid — yours alone; your companion is travelling separately until Arima. Check-in after 15:00, check-out before 11:00. Free natural hot spring, outdoor bath and sauna; free yonaki soba every night. NOTE: no room cleaning service on this rate.',
        type: 'LODGING',
        place_name: 'Dormy Inn Premium Namba Natural Hot Spring',
        address: '2-14-23 Shimanouchi, Chuo-ku, Osaka 542-0082 · +81 6 6214 5489',
        lat: 34.6707, lng: 135.5045,
        is_booked: true,
        booking_ref: NAMBA_REF,
      },
      {
        order: 6,
        start_time: '16:00',
        duration_min: 120,
        title: '🏋 Gym — Gold’s Gym Shinsaibashi',
        description:
          'BIG STEP 6F, about 5 min from the hotel. Open to 23:30 Mon–Sat. Walk-in visitor pass ¥2,800: bring cash, passport and indoor shoes. Worth knowing you have been awake since Friday — the master plan advised skipping this one, so treat it as optional if the red-eye has caught up with you.',
        type: 'SIGHT',
        place_name: "Gold's Gym Shinsaibashi",
        lat: 34.6748, lng: 135.5008,
        cost_jpy: 2800,
      },
      {
        order: 7,
        start_time: '18:00',
        duration_min: 30,
        title: 'Hozen-ji and Hozenji Yokocho',
        description:
          'The moss-covered Fudo-myoo statue, and the narrow lantern-lit stone lanes beside it. Minutes from Dotonbori but a completely different register.',
        type: 'SIGHT',
        place_name: 'Hozenji Yokocho',
        lat: 34.6683, lng: 135.5029,
      },
      {
        order: 8,
        start_time: '18:30',
        duration_min: 120,
        title: 'Dotonbori — neon, the canal and street food',
        description:
          'Three minutes from the hotel. The Glico runner and the mechanical crab. Eat as you walk: takoyaki (Wanaka or Kukuru), okonomiyaki Osaka-style with everything mixed in (Chibo or Mizuno), ikayaki, 551 Horai butaman.',
        type: 'FOOD',
        place_name: 'Dotonbori',
        lat: 34.6687, lng: 135.5013,
        cost_jpy: 3000,
      },
      {
        order: 9,
        start_time: '21:30',
        duration_min: 60,
        title: 'Free yonaki soba, then the hot spring bath',
        description: 'Free ramen every night, and ice cream after the evening soak.',
        type: 'ONSEN',
        place_name: 'Dormy Inn Premium Namba Natural Hot Spring',
        lat: 34.6707, lng: 135.5045,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-20',
    day_number: 2,
    title: 'Taima-dera, then the Tennoji temples',
    summary:
      'Out to Katsuragi for Taima-dera and soba, back for Shitennō-ji and Isshin-ji, then Shinsekai and the second gym session.',
    base_city: 'Osaka',
    activities: [
      {
        order: 1,
        start_time: '07:50',
        duration_min: 70,
        title: 'Namba → Taimadera',
        description:
          'Kintetsu Minami-Osaka line from Osaka-Abenobashi (connected to Tennoji) to Taimadera, then ~15 min on foot. Taima-dera is in Katsuragi, Nara prefecture — this is a proper excursion, not a city hop.',
        type: 'TRANSPORT',
        place_name: 'Taimadera Station',
        lat: 34.5211, lng: 135.6989,
      },
      {
        order: 2,
        start_time: '09:00',
        duration_min: 180,
        title: 'Taima-dera',
        description:
          'Open 09:00–17:00, ¥500. Two surviving Nara-period pagodas — the only temple in Japan with both its east and west pagodas still standing — and the Taima Mandala. Quiet in a way nothing in central Osaka is.',
        type: 'SIGHT',
        place_name: 'Taima-dera',
        lat: 34.5175, lng: 135.6923,
        cost_jpy: 500,
      },
      {
        order: 3,
        start_time: '12:00',
        duration_min: 60,
        title: 'Lunch — 蕎麦屋薬庵 (Sobaya Yakuan)',
        description:
          'Soba near Taima-dera. Verify the opening day before relying on it — small rural soba shops close irregularly, and 20 September is inside Silver Week.',
        type: 'FOOD',
        place_name: '蕎麦屋薬庵',
        cost_jpy: 1800,
      },
      {
        order: 4,
        start_time: '13:10',
        duration_min: 70,
        title: 'Taimadera → Shitennō-ji',
        description: 'Kintetsu back to Osaka-Abenobashi / Tennoji, then ~10 min on foot north.',
        type: 'TRANSPORT',
        place_name: 'Tennoji Station',
        lat: 34.6465, lng: 135.5136,
      },
      {
        order: 5,
        start_time: '14:30',
        duration_min: 30,
        title: 'Shitennō-ji',
        description:
          'Founded 593 — Japan’s first state-built Buddhist temple. The garden and inner precinct charge separately; the outer grounds are free.',
        type: 'SIGHT',
        place_name: 'Shitennō-ji',
        lat: 34.6541, lng: 135.5165,
        cost_jpy: 300,
      },
      {
        order: 6,
        start_time: '15:00',
        duration_min: 60,
        title: 'Isshin-ji',
        description:
          'Ten minutes’ walk from Shitennō-ji. Known for its okotsubutsu — Buddha images made from the ashes of the dead — and a startlingly modern gate.',
        type: 'SIGHT',
        place_name: 'Isshin-ji',
        lat: 34.6533, lng: 135.5108,
      },
      {
        order: 7,
        start_time: '16:00',
        duration_min: 120,
        title: 'Tsutenkaku Hondori Shopping Street',
        description:
          '1950s Osaka preserved in amber: lattice tower, hand-painted signage, pufferfish lanterns. Kushikatsu is the neighbourhood signature — NO DOUBLE DIPPING in the communal sauce, take cabbage to scoop more. Daruma is the famous name.',
        type: 'SHOPPING',
        place_name: 'Tsutenkaku Hondori Shopping Street',
        lat: 34.6512, lng: 135.5063,
        cost_jpy: 2500,
      },
      {
        order: 8,
        start_time: '18:00',
        duration_min: 120,
        title: '🏋 Gym — Gold’s Gym Shinsaibashi',
        description:
          'SUNDAY IS THE ONE DAY GOLD’S CLOSES EARLY, AT 22:00 — an 18:00 start is comfortable. Sakaisuji line from Ebisucho to Nagahoribashi, or Midosuji via Namba. Alternatives: Torque Gym Namba (24/7, rated 4.8) or Urbanfit 24 Namba (24/7, cheaper, includes towel and water).',
        type: 'SIGHT',
        place_name: "Gold's Gym Shinsaibashi",
        lat: 34.6748, lng: 135.5008,
        cost_jpy: 2800,
      },
      {
        order: 9,
        start_time: '20:30',
        duration_min: 60,
        title: 'Free yonaki soba, then the bath',
        type: 'ONSEN',
        place_name: 'Dormy Inn Premium Namba Natural Hot Spring',
        lat: 34.6707, lng: 135.5045,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-21',
    day_number: 3,
    title: 'Osaka → Arima Onsen',
    summary:
      'Umeda in the morning, the 12:50 bus, bags down at Goshobo by 14:00 — then the whole afternoon walking the old town: three springheads, two temples, and both public baths. This is where The companion joins; Arima is the shared leg.',
    base_city: 'Arima',
    activities: [
      {
        order: 1,
        start_time: '09:30',
        duration_min: 30,
        title: 'Check out of Dormy Inn Namba',
        description: 'Before 11:00. You are carrying a backpack, so nothing to forward.',
        type: 'LODGING',
        place_name: 'Dormy Inn Premium Namba Natural Hot Spring',
        lat: 34.6707, lng: 135.5045,
      },
      {
        order: 2,
        start_time: '10:00',
        duration_min: 150,
        title: 'Hankyu Sanban Gai, Umeda',
        description:
          'Shopping above, and one of Japan’s great depachika food halls directly below the bus terminal. BUY LUNCH OR TONIGHT’S BACKUP DINNER HERE — Arima closes early and 21–23 September are all national holidays. If the bus is still unbooked, the Hankyu Osaka Umeda Tourist Center sells same-day tickets 06:50–23:00 and advance tickets 09:00–18:30.',
        type: 'SHOPPING',
        place_name: 'Hankyu Sanbangai depachika, Umeda',
        lat: 34.7053, lng: 135.4986,
        cost_jpy: 3000,
      },
      {
        order: 3,
        start_time: '12:50',
        duration_min: 60,
        title: 'Highway bus, Umeda → Arima Onsen',
        description:
          'Departs 12:50 from the Hankyu Sanbangai Highway Bus Terminal on 1F — from Osaka-Umeda Station follow the signs to 1-1-3 Shibata, Kita-ku, about 3 min. ALL SEATS RESERVED, so this must be booked in advance, and reservations open exactly one month before boarding — 21 August for this leg, 23 August for the return, separately. ¥1,400, about an hour, no changes. Ask about the round-trip-plus-Taiko-no-Yu combined ticket before buying the legs separately.',
        type: 'TRANSPORT',
        place_name: 'Arima Onsen bus stop',
        lat: 34.7975, lng: 135.2478,
        cost_jpy: 1400,
        transport_options: [
          {
            label: 'Hankyu Highway Bus, direct',
            mode: 'bus',
            duration_min: 60,
            cost_jpy: 1400,
            from_place: 'Hankyu Sanbangai, Umeda',
            to_place: 'Arima Onsen',
            notes: 'All-reserved seating. Stops beside Goshobo. Book both directions together.',
            is_selected: true,
          },
          {
            label: 'Train via Sannomiya and Kobe Electric Railway',
            mode: 'train',
            duration_min: 95,
            cost_jpy: 1500,
            from_place: 'Osaka',
            to_place: 'Arima Onsen',
            notes: 'Two changes and a steep climb from Arima Onsen Station. Fallback only.',
          },
        ],
      },
      {
        order: 4,
        start_time: '14:00',
        duration_min: 20,
        title: 'Arrive Goshobo — drop bags, check in early',
        description:
          'The ryokan is right beside the bus stop, and this is where you and your companion meet — Goshobo is one room with two beds, and the only nights you share. Formal check-in is 15:00–21:00, but bags go down on arrival and they will check you in early if the room is ready. Established 1191, sixteen generations. JPY 600 bathing tax payable at the property.',
        type: 'LODGING',
        place_name: 'Arima Onsen Tocen Goshobo',
        address: '858 Arimacho, Kita Ward, Kobe, Hyogo 651-1401',
        lat: 34.7975, lng: 135.2478,
        is_booked: true,
        booking_ref: GOSHOBO_REF,
        cost_jpy: 600,
      },
      {
        order: 5,
        start_time: '14:20',
        duration_min: 25,
        title: 'Arima Main Road — Yumotozaka',
        description:
          'The historic street up from the river, and the walk everything else on this afternoon hangs off. Tansan senbei baked in front of you, free ashiyu foot baths, and carbonated spring water to taste.',
        type: 'SIGHT',
        place_name: 'Arima Onsen old town',
        lat: 34.7968, lng: 135.2481,
      },
      {
        order: 6,
        start_time: '14:50',
        duration_min: 15,
        title: 'Tenjin Hot Spring Source',
        description:
          'A minute from the ryokan, behind Tenjin shrine. Steam comes straight off the 98°C kinsen — this is the water everything in town is drawing from.',
        type: 'SIGHT',
        place_name: 'Tenjin Hot Spring Source',
        lat: 34.7972, lng: 135.2487,
      },
      {
        order: 7,
        start_time: '15:10',
        duration_min: 55,
        title: 'Arima Toys and Automata Museum',
        description:
          'Six floors of German and Czech automata, tin toys and karakuri puppets. ¥800. Small, odd, and a genuinely good hour — more interesting than the name suggests.',
        type: 'SIGHT',
        place_name: 'Arima Toys and Automata Museum',
        lat: 34.7968, lng: 135.2486,
        cost_jpy: 800,
      },
      {
        order: 8,
        start_time: '16:10',
        duration_min: 10,
        title: 'Gosho Hot Spring Source',
        description: 'The second springhead, a few lanes up. Free to look at.',
        type: 'SIGHT',
        place_name: 'Gosho Hot Spring Source',
        lat: 34.7965, lng: 135.2480,
      },
      {
        order: 9,
        start_time: '16:25',
        duration_min: 20,
        title: 'Onsen-ji',
        description:
          'The temple at the heart of Arima, founded in the 8th century by the monk Gyoki, who is credited with reviving the springs. The Hatto hall holds an important Yakushi Nyorai — the medicine Buddha, which is the whole point of a hot spring town.',
        type: 'SIGHT',
        place_name: 'Onsen-ji',
        lat: 34.7970, lng: 135.2495,
      },
      {
        order: 10,
        start_time: '16:50',
        duration_min: 15,
        title: 'Nenbutsu-ji',
        description:
          'Next door to Onsen-ji. A quiet Jodo-shu temple with a 250-year-old sarusuberi in the courtyard, and a garden view over the valley almost nobody stops for.',
        type: 'SIGHT',
        place_name: 'Nenbutsu-ji',
        lat: 34.7968, lng: 135.2492,
      },
      {
        order: 11,
        start_time: '17:10',
        duration_min: 10,
        title: 'Gokuraku Hot Spring Source',
        description:
          'The third springhead, beside Gokuraku-ji. That is all three — Tenjin, Gosho and Gokuraku — within a few hundred metres of each other.',
        type: 'SIGHT',
        place_name: 'Gokuraku Hot Spring Source',
        lat: 34.7966, lng: 135.2490,
      },
      {
        order: 12,
        start_time: '17:25',
        duration_min: 40,
        title: 'Gin no Yu',
        description:
          'The clear one — carbonated and radium-enriched ginsen, colourless and much lighter than the iron-brown kinsen. Modern building, quieter than Kin no Yu. Closes 1st and 3rd Tuesdays, so it is open today.',
        type: 'ONSEN',
        place_name: 'Gin no Yu',
        lat: 34.7950, lng: 135.2462,
        cost_jpy: 1200,
      },
      {
        order: 13,
        start_time: '18:10',
        duration_min: 35,
        title: 'Kin no Yu',
        description:
          'The famous one — iron-rich kinsen, opaque and rust-brown, at the centre of town. A ¥1,200 combination ticket covers both baths if you bought it at Gin no Yu. Kin no Yu normally shuts 2nd and 4th Tuesdays but opens on public holidays and closes the following day instead — so open Mon 21 and Tue 22, and SHUT Wed 23. There is a free ashiyu foot bath outside if you have had enough water.',
        type: 'ONSEN',
        place_name: 'Kin no Yu',
        lat: 34.7970, lng: 135.2480,
      },
      {
        order: 14,
        start_time: '19:00',
        duration_min: 105,
        title: 'Dinner — no-beef kaiseki, or the fallback',
        description:
          'If the seafood-and-vegetable kaiseki was arranged, this is likely the best meal of the trip: Goshobo’s fish comes directly from Akashi-Ura port. Otherwise Soba Dosanjin (17:00–20:00, closed Wed, book ahead), Aramiya izakaya, or the depachika bento from this morning. AVOID Gekkoen Yugetsusanso: reservation-only at 17:45 or 19:30 and not served on public holidays.',
        type: 'FOOD',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 15,
        start_time: '21:00',
        duration_min: 60,
        title: 'First soak — free-flowing kinsen',
        description:
          'Straight from the source, which is rare in Arima where limited supply forces most properties onto recirculated water. The main bath is semi-mixed, behind a privacy wall. Reserve one of the two chartered private baths at the front desk while you are there.',
        type: 'ONSEN',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-22',
    day_number: 4,
    title: 'Arima — the bathing day, deliberately open',
    summary:
      'Taiko no Yu is the only thing booked into today. The rest is left blank on purpose: this is the rest day, and Goshobo plus the town will fill it.',
    base_city: 'Arima',
    activities: [
      {
        order: 1,
        start_time: '06:30',
        duration_min: 60,
        title: 'Early soak before breakfast',
        type: 'ONSEN',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 2,
        start_time: '08:00',
        duration_min: 60,
        title: 'Breakfast',
        description:
          'Ryokan breakfast if taken — grilled fish, rice, miso, pickles, tamago, no beef anywhere near it. If skipping: Pan du Bo opens 09:00 and sells until sold out (its usual Tuesday closure shifts to Wednesday because Tuesday is a holiday), or Houkyuuan 10:00–18:00 for Tanba black bean, Arima sansho and kinsen salt breads.',
        type: 'FOOD',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 3,
        start_time: '10:00',
        duration_min: 240,
        title: 'Taiko no Yu — go at opening',
        description:
          '26 bath types across three waters: kinsen, ginsen and carbonated. Six open-air varieties including rock, Goemon, carbonated and herbal, plus a rooftop open-air bath, lava sauna, cold air bath and steam bath. Book the bedrock bath early — it runs in 30-minute shifts. The crowd builds fast on a public holiday. Restaurants inside serve until 22:00, so lunch here is easy. CONFIRMED OPEN: the 2026 closure days are 6–7 April, 6–7 July and 13 October. ¥2,970 on the door, but the Hankyu combined ticket bundles this with the round-trip bus for less.',
        type: 'ONSEN',
        place_name: 'Arima Taiko no Yu',
        lat: 34.7936, lng: 135.2506,
        cost_jpy: 2970,
      },
      {
        order: 4,
        start_time: '14:30',
        duration_min: 180,
        title: 'Open — the town, the ropeway, or nothing at all',
        description:
          'DELIBERATELY UNPLANNED. Options if you want them: the Arima–Rokko Ropeway to Rokko Garden Terrace (confirm it is not in maintenance closure); Zuiho-ji Park; the bakeries; or simply back to Goshobo. This is the one genuinely slack afternoon of the trip and it is worth protecting.',
        type: 'SIGHT',
        place_name: 'Arima Onsen old town',
        lat: 34.7968, lng: 135.2481,
      },
      {
        order: 5,
        start_time: '18:00',
        duration_min: 60,
        title: 'The chartered private bath at Goshobo',
        description: 'Reserved at the front desk on arrival.',
        type: 'ONSEN',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 6,
        start_time: '19:15',
        duration_min: 120,
        title: 'Dinner',
        description:
          'The no-beef kaiseki if arranged. Otherwise Aramiya izakaya (sashimi, tempura, onigiri, tai-chazuke — where locals drink, cheap, open late), Arima 18-ban (shirasu over rice and akashiyaki), or eat at Taiko no Yu before leaving.',
        type: 'FOOD',
        place_name: 'Arima Onsen',
        lat: 34.7968, lng: 135.2481,
        cost_jpy: 4000,
      },
      {
        order: 7,
        start_time: '21:30',
        duration_min: 60,
        title: 'Final soak',
        type: 'ONSEN',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-23',
    day_number: 5,
    title: 'Arima → Kyoto',
    summary:
      'Out of Goshobo, back through Umeda, into Kyoto before lunch. Gym 14:00–16:00, then Nishiki while it is still open and the walk home along the river. Your companion heads their own way from here.',
    base_city: 'Kyoto',
    activities: [
      {
        order: 1,
        start_time: '06:45',
        duration_min: 45,
        title: 'Soak first thing',
        description:
          'Check-out is before 10:00, earlier than most ryokan. Confirm bath hours with the property so you do not miss the window.',
        type: 'ONSEN',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 2,
        start_time: '07:45',
        duration_min: 60,
        title: 'Take the ryokan breakfast this morning',
        description:
          'Not optional. You are out early and nothing in town is open — Pan du Bo is closed (its Tuesday closure shifted to Wednesday) and Houkyuuan does not open until 10:00.',
        type: 'FOOD',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 3,
        start_time: '09:15',
        duration_min: 30,
        title: 'Check out of Goshobo',
        description:
          'The end of the shared leg — Your companion goes their own way from here, and the Kyoto nights are yours alone.',
        type: 'LODGING',
        place_name: 'Arima Onsen Tocen Goshobo',
        lat: 34.7975, lng: 135.2478,
      },
      {
        order: 4,
        start_time: '10:00',
        duration_min: 60,
        title: 'Highway bus, Arima → Umeda',
        description:
          'An earlier bus than the plan used to assume, because the gym is now at 14:00 in Kyoto and the whole morning has to fit in front of it. Book both directions together — still outstanding.',
        type: 'TRANSPORT',
        place_name: 'Hankyu Sanbangai, Umeda',
        lat: 34.7053, lng: 135.4986,
        cost_jpy: 1400,
      },
      {
        order: 5,
        start_time: '11:15',
        duration_min: 45,
        title: 'Lunch in the Hankyu depachika',
        description:
          'A short stop rather than Monday’s proper browse — you have a train to catch. The food hall is directly below the bus terminal, so there is no walking involved.',
        type: 'FOOD',
        place_name: 'Hankyu Sanbangai depachika, Umeda',
        lat: 34.7053, lng: 135.4986,
        cost_jpy: 1800,
      },
      {
        order: 6,
        start_time: '12:10',
        duration_min: 50,
        title: 'Umeda → Kyoto',
        description: 'Five minutes on foot to Osaka Station, then the JR Special Rapid, ~29 min.',
        type: 'TRANSPORT',
        place_name: 'Kyoto Station',
        lat: 34.9858, lng: 135.7588,
        transport_options: [
          {
            label: 'JR Special Rapid, Osaka → Kyoto',
            mode: 'train',
            duration_min: 29,
            cost_jpy: 580,
            from_place: 'Osaka Station',
            to_place: 'Kyoto Station',
            is_selected: true,
          },
          {
            label: 'Shinkansen from Shin-Osaka',
            mode: 'shinkansen',
            duration_min: 15,
            cost_jpy: 1450,
            from_place: 'Shin-Osaka',
            to_place: 'Kyoto',
            notes: 'Faster on paper, but getting to Shin-Osaka wipes out the gain.',
          },
        ],
      },
      {
        order: 7,
        start_time: '13:00',
        duration_min: 20,
        title: 'Drop the backpack at Dormy Inn Kyoto Ekimae',
        description:
          'Check-in is not until 15:00 and you will be at the gym then, so leave the bag now and check in properly this evening. Three minutes from Kyoto Station, beside Kyoto Tower.',
        type: 'LODGING',
        place_name: 'Dormy Inn Premium Kyoto Ekimae Natural Hot Spring',
        address: '558-8 Higashishiokojicho, Shimogyo-ku, Kyoto 600-8216 · +81 75 371 5489',
        lat: 34.9885, lng: 135.7580,
        is_booked: true,
        booking_ref: KYOTO_REF,
      },
      {
        order: 8,
        start_time: '14:00',
        duration_min: 120,
        title: '🏋 Gym — Gold’s Gym Kyoto Nijo',
        description:
          'Inside the JR Nijo Station building (NK Bldg 2F) — JR Sagano line, 2 stops from Kyoto Station, no walk at the far end. Open 24 hours. An afternoon session leaves the evening free, and gets you to Nishiki while it is still trading.',
        type: 'SIGHT',
        place_name: "Gold's Gym Kyoto Nijo",
        address: '3 Nishinokyo Higashitogao-cho, Nakagyo-ku · JR Nijo Station NK Bldg 2F',
        lat: 35.0106, lng: 135.7385,
        cost_jpy: 2800,
      },
      {
        order: 9,
        start_time: '16:30',
        duration_min: 90,
        title: 'Nishiki Market — graze, do not eat a meal',
        description:
          'Kyoto’s kitchen, four hundred years old. Tamagoyaki from Miki Keiran, tsukemono, soy milk doughnuts, fresh yuba, warabimochi in kinako. MOST STALLS SHUT AROUND 18:00, which is exactly why the gym moved to the afternoon — arriving at 16:30 gives you the market working rather than shuttered.',
        type: 'FOOD',
        place_name: 'Nishiki Market',
        lat: 35.0050, lng: 135.7648,
        cost_jpy: 2000,
      },
      {
        order: 10,
        start_time: '18:15',
        duration_min: 60,
        title: 'Teramachi and Shinkyogoku arcades',
        description:
          'Covered, and open later than Nishiki. Animate Kyoto, Melonbooks, gachapon, clothing and souvenirs.',
        type: 'SHOPPING',
        place_name: 'Teramachi Shopping Arcade',
        lat: 35.0058, lng: 135.7669,
      },
      {
        order: 11,
        start_time: '19:20',
        duration_min: 50,
        title: 'Walk back — the Takase river and the Kamogawa',
        description:
          'About 2 km south, and worth doing on foot rather than taking the subway. The Takase is the willow-lined canal beside Kiyamachi; join the Kamogawa bank at Shijo and follow it down to Shichijo, then west to the hotel.',
        type: 'SIGHT',
        place_name: 'Takase River',
        lat: 35.0035, lng: 135.7690,
      },
      {
        order: 12,
        start_time: '20:15',
        duration_min: 60,
        title: 'Check in properly, then the hot spring bath',
        description:
          'One double room, 3 nights, prepaid, occupancy 1 — yours alone. Natural hot spring, three hot tubs, sauna; free noodles nightly. NOTE: no room cleaning service on this rate.',
        type: 'ONSEN',
        place_name: 'Dormy Inn Premium Kyoto Ekimae Natural Hot Spring',
        lat: 34.9885, lng: 135.7580,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-24',
    day_number: 6,
    title: 'East Kyoto — Fushimi Inari to Chion-in',
    summary:
      'Fushimi Inari at 07:00 while it is still empty, then the whole Higashiyama ridge on foot: Sannenzaka, Kiyomizu, Kōdai-ji, Ninenzaka, Gion and Chion-in.',
    base_city: 'Kyoto',
    activities: [
      {
        order: 1,
        start_time: '06:40',
        duration_min: 20,
        title: 'Kyoto Station → Inari',
        type: 'TRANSPORT',
        place_name: 'Inari Station',
        lat: 34.9670, lng: 135.7719,
        transport_options: [
          {
            label: 'JR Nara line, 2 stops',
            mode: 'train',
            duration_min: 5,
            cost_jpy: 150,
            from_place: 'Kyoto Station',
            to_place: 'Inari',
            notes: 'Drops you at the shrine gate. Nothing else comes close.',
            is_selected: true,
          },
        ],
      },
      {
        order: 2,
        start_time: '07:00',
        duration_min: 150,
        title: 'Fushimi Inari Taisha — climb to Yotsutsuji',
        description:
          'Thousands of vermilion torii up the mountain. At seven you will have long stretches to yourselves. Climb at least to the Yotsutsuji viewpoint. Breakfast at the shrine-approach stalls on the way out: grilled quail, or inari-zushi, which originates here.',
        type: 'SIGHT',
        place_name: 'Fushimi Inari Taisha',
        lat: 34.9671, lng: 135.7727,
      },
      {
        order: 3,
        start_time: '10:00',
        duration_min: 60,
        title: 'Sannenzaka',
        description:
          'Preserved stone-stepped lanes and wooden machiya, climbing toward Kiyomizu. The most photogenic streets in the city, and best walked upward before the crowds thicken.',
        type: 'SIGHT',
        place_name: 'Sannenzaka',
        lat: 34.9963, lng: 135.7822,
      },
      {
        order: 4,
        start_time: '11:00',
        duration_min: 90,
        title: 'Kiyomizu-dera',
        description:
          'The great wooden stage over the hillside with the city below — the best single view in Kyoto. ¥500. The maples will be a deep luminous green, which has its own quality.',
        type: 'SIGHT',
        place_name: 'Kiyomizu-dera',
        lat: 34.9949, lng: 135.7850,
        cost_jpy: 500,
      },
      {
        order: 5,
        start_time: '12:45',
        duration_min: 45,
        title: 'Ninenzaka',
        description:
          'The lower of the two preserved slopes, with teahouses and the Starbucks in a machiya. Lunch anywhere along here.',
        type: 'FOOD',
        place_name: 'Ninenzaka',
        lat: 34.9975, lng: 135.7810,
        cost_jpy: 2500,
      },
      {
        order: 6,
        start_time: '13:45',
        duration_min: 75,
        title: 'Kōdai-ji',
        description:
          'Built in 1606 for Nene, widow of Hideyoshi. Momoyama-period lacquer, a bamboo grove far quieter than Arashiyama’s, and two of the finest teahouses in Japan. ¥600.',
        type: 'SIGHT',
        place_name: 'Kōdai-ji',
        lat: 35.0000, lng: 135.7808,
        cost_jpy: 600,
      },
      {
        order: 7,
        start_time: '15:15',
        duration_min: 90,
        title: 'Gion and Kennin-ji',
        description:
          'Kennin-ji is Kyoto’s oldest Zen temple, founded 1202 — the twin dragons on the Hatto ceiling and a dry garden almost nobody queues for. ¥600. The private alleys off Hanamikoji are closed to tourists and carry fines; stay on the main streets.',
        type: 'SIGHT',
        place_name: 'Gion',
        lat: 35.0037, lng: 135.7752,
        cost_jpy: 600,
      },
      {
        order: 8,
        start_time: '17:00',
        duration_min: 60,
        title: 'Chion-in',
        description:
          'The head temple of Pure Land Buddhism. The Sanmon is the largest wooden gate in Japan, and the grounds are free even when the halls have closed — which by 17:00 they will have. Worth it for the gate alone.',
        type: 'SIGHT',
        place_name: 'Chion-in',
        lat: 35.0053, lng: 135.7833,
      },
      {
        order: 9,
        start_time: '18:15',
        duration_min: 90,
        title: 'Dinner in Gion',
        description:
          'Nishin soba (buckwheat noodles with sweet-simmered herring) or saba-zushi (pressed mackerel).',
        type: 'FOOD',
        place_name: 'Gion',
        lat: 35.0037, lng: 135.7752,
        cost_jpy: 4500,
      },
      {
        order: 10,
        start_time: '20:15',
        duration_min: 105,
        title: '🏋 Gym — Gold’s Gym Kyoto Nijo',
        description:
          'Open 24 hours, which is the point after a day that started at 06:40 and covered the whole Higashiyama ridge. Treat it as optional if the legs have gone — this is the longest walking day of the trip.',
        type: 'SIGHT',
        place_name: "Gold's Gym Kyoto Nijo",
        lat: 35.0106, lng: 135.7385,
        cost_jpy: 2800,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-25',
    day_number: 7,
    title: 'Nara',
    summary:
      'Kasuga Taisha, the deer and Tōdai-ji, back to Kyoto in the evening. No moon-viewing this year.',
    base_city: 'Kyoto',
    activities: [
      {
        order: 1,
        start_time: '08:00',
        duration_min: 45,
        title: 'Kyoto → Nara',
        description:
          'Many Japanese take 24–25 September as leave to stretch Silver Week to nine days. Go early regardless.',
        type: 'TRANSPORT',
        place_name: 'Kintetsu Nara Station',
        lat: 34.6844, lng: 135.8299,
        transport_options: [
          {
            label: 'Kintetsu limited express',
            mode: 'train',
            duration_min: 35,
            cost_jpy: 1280,
            from_place: 'Kyoto Station',
            to_place: 'Kintetsu Nara',
            notes: 'Reserved seats, and Kintetsu Nara is closer to the park than JR Nara.',
            is_selected: true,
          },
          {
            label: 'JR Miyakoji rapid',
            mode: 'train',
            duration_min: 45,
            cost_jpy: 720,
            from_place: 'Kyoto Station',
            to_place: 'JR Nara',
            notes: 'Cheaper, no reservation, but a longer walk at the Nara end.',
          },
        ],
      },
      {
        order: 2,
        start_time: '09:00',
        duration_min: 90,
        title: 'Kasuga Taisha',
        description:
          'Founded 768. Thousands of stone and bronze lanterns along the forest approach, and vermilion columns against the cedar. ¥500 for the inner precinct.',
        type: 'SIGHT',
        place_name: 'Kasuga Taisha',
        lat: 34.6815, lng: 135.8483,
        cost_jpy: 500,
      },
      {
        order: 3,
        start_time: '10:45',
        duration_min: 90,
        title: 'Nara Park and the deer',
        description:
          'Buy shika-senbei and expect to be mobbed. They bow for it, which is genuinely charming the first six times.',
        type: 'SIGHT',
        place_name: 'Nara Park',
        lat: 34.6851, lng: 135.8430,
        cost_jpy: 200,
      },
      {
        order: 4,
        start_time: '12:30',
        duration_min: 90,
        title: 'Tōdai-ji',
        description:
          'The Great Buddha Hall, among the largest wooden buildings in the world, housing one of Japan’s largest bronze Buddhas. ¥800.',
        type: 'SIGHT',
        place_name: 'Tōdai-ji',
        lat: 34.6889, lng: 135.8398,
        cost_jpy: 800,
      },
      {
        order: 5,
        start_time: '14:15',
        duration_min: 90,
        title: 'Lunch in Nara',
        description:
          'Kakinoha-zushi (sushi wrapped in persimmon leaf), Nakatanidou mochi pounding near Sanjo-dori — they pound at astonishing speed as a live performance several times a day — narazuke pickles, kudzu sweets.',
        type: 'FOOD',
        place_name: 'Nakatanidou',
        lat: 34.6828, lng: 135.8286,
        cost_jpy: 2000,
      },
      {
        order: 6,
        start_time: '16:00',
        duration_min: 45,
        title: 'Return to Kyoto',
        type: 'TRANSPORT',
        place_name: 'Kyoto Station',
        lat: 34.9858, lng: 135.7588,
        transport_options: [
          {
            label: 'Kintetsu limited express',
            mode: 'train',
            duration_min: 35,
            cost_jpy: 1280,
            from_place: 'Kintetsu Nara',
            to_place: 'Kyoto Station',
            is_selected: true,
          },
        ],
      },
      {
        order: 7,
        start_time: '17:30',
        duration_min: 120,
        title: '🏋 Gym — Gold’s Gym Kyoto Nijo',
        description:
          'The moon-viewing is not happening this year, so Friday evening is free. Open 24 hours — go whenever suits after Nara. Tonight is also the harvest moon regardless: if the eastern sky is clear, tsukimi dango from any wagashi shop and a walk along the Kamogawa costs nothing.',
        type: 'SIGHT',
        place_name: "Gold's Gym Kyoto Nijo",
        lat: 35.0106, lng: 135.7385,
        cost_jpy: 2800,
      },
      {
        order: 8,
        start_time: '20:00',
        duration_min: 90,
        title: 'Dinner',
        description:
          'Tsukimi menu items appear nationwide around the 25th and usually mean a raw egg yolk standing in for the moon. Also worth ordering: sanma grilled whole with salt and grated daikon, the definitive taste of Japanese autumn.',
        type: 'FOOD',
        place_name: 'Kyoto',
        lat: 35.0050, lng: 135.7710,
        cost_jpy: 4000,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  {
    date: '2026-09-26',
    day_number: 8,
    title: 'Kyoto Station, then home',
    summary:
      'No Arashiyama. Check out, spend the morning shopping under Kyoto Station, Haruka at 14:00, MM773 departs 18:25.',
    base_city: 'Kyoto',
    activities: [
      {
        order: 1,
        start_time: '09:30',
        duration_min: 30,
        title: 'Check out, and leave the backpack at the front desk',
        description:
          'Before 11:00. The desk holds bags after check-out at no charge, and you are three minutes from both the shops and the Haruka platform — so there is no reason to carry it around Isetan.',
        type: 'LODGING',
        place_name: 'Dormy Inn Premium Kyoto Ekimae Natural Hot Spring',
        lat: 34.9885, lng: 135.7580,
      },
      {
        order: 2,
        start_time: '10:00',
        duration_min: 210,
        title: 'Kyoto Station — the last shopping',
        description:
          'ISETAN DEPACHIKA (B1–B2) for premium confections and regional gifts; PORTA, the underground mall, for casual shopping. Matcha sweets, yatsuhashi, Uji tea, tsukemono. Carry your passport — the instant in-store tax deduction still applies until 1 November 2026.',
        type: 'SHOPPING',
        place_name: 'Kyoto Station Porta',
        lat: 34.9858, lng: 135.7588,
        cost_jpy: 6000,
      },
      {
        order: 3,
        start_time: '12:00',
        duration_min: 60,
        title: 'Lunch at Kyoto Station',
        description:
          'Kyoto Ramen Koji on the 10th floor of the station building — nine ramen shops from around Japan in one corridor. Or Honke Daiichi Asahi, the queue outside the station on Shiokoji-dori.',
        type: 'FOOD',
        place_name: 'Kyoto Ramen Koji',
        lat: 34.9860, lng: 135.7590,
        cost_jpy: 1500,
      },
      {
        order: 4,
        start_time: '13:30',
        duration_min: 20,
        title: 'Collect the backpack',
        description: 'Three minutes each way. You are then three minutes from the Haruka platform.',
        type: 'ADMIN',
        place_name: 'Dormy Inn Premium Kyoto Ekimae Natural Hot Spring',
        lat: 34.9885, lng: 135.7580,
      },
      {
        order: 5,
        start_time: '14:00',
        duration_min: 95,
        title: 'Haruka, Kyoto → KIX',
        description:
          'Departs 14:00, arrives Kansai Airport 15:35. Discounted HARUKA one-way ticket bought online from JR-West, restricted to Temporary Visitor status. STILL TO BOOK.',
        type: 'TRANSPORT',
        place_name: 'Kansai International Airport',
        lat: 34.4342, lng: 135.2328,
        cost_jpy: 2200,
        transport_options: [
          {
            label: 'JR Haruka, direct',
            mode: 'train',
            duration_min: 80,
            cost_jpy: 2200,
            from_place: 'Kyoto Station',
            to_place: 'KIX',
            notes: 'Reservations open one month ahead at 10:00 JST.',
            is_selected: true,
          },
          {
            label: 'Limousine bus',
            mode: 'bus',
            duration_min: 105,
            cost_jpy: 2600,
            from_place: 'Kyoto Station',
            to_place: 'KIX',
            notes: 'Traffic risk on a Saturday. Not for a flight you cannot miss.',
          },
        ],
      },
      {
        order: 6,
        start_time: '15:35',
        duration_min: 170,
        title: 'At KIX Terminal 2 — check in for MM773',
        description:
          'Peach closes international check-in roughly 60 min before departure and KIX queues are long on a Saturday. Baggage should already be pre-paid and pre-weighed; airport-rate excess is punitive.',
        type: 'ADMIN',
        place_name: 'Kansai International Airport Terminal 2',
        lat: 34.4273, lng: 135.2325,
      },
      {
        order: 7,
        start_time: '18:25',
        duration_min: 405,
        title: 'MM773 Peach · KIX T2 → SIN T2',
        description:
          'Lands Singapore 00:05 on Sunday 27 September, after MRT hours. Rides should be pre-arranged.',
        type: 'TRANSPORT',
        place_name: 'Kansai International Airport Terminal 2',
        lat: 34.4273, lng: 135.2325,
        is_booked: true,
        booking_ref: 'DEF456',
      },
    ],
  },
]

export const CHECKLIST: SeedChecklistItem[] = [
  // ── Still outstanding ─────────────────────────────────────────────────
  {
    title: '🚆 Book the Kyoto → KIX Haruka for Sat 26 Sep, 14:00',
    detail:
      'Discounted HARUKA One-way Ticket from JR-West online, restricted to Temporary Visitor status — which applies to you both. Reservations open one month ahead at 10:00 JST, so from 26 August. The 14:00 departure arrives KIX 15:35, which is the timing the last day is built around.',
    category: 'transport',
    due_date: '2026-08-26',
    is_blocking: true,
  },
  {
    title: '🚌 Reserve the Arima bus OUTBOUND — 12:50, Mon 21 Sep',
    detail:
      'Hankyu accepts reservations from ONE MONTH BEFORE THE DATE OF BOARDING, so each direction opens on its own date — the two cannot be booked together. This one opens Fri 21 August. It is the Monday of Silver Week, every seat is reserved, and the fallback is a 95-minute train via Sannomiya with two changes and a climb up from Arima Onsen Station — which breaks the 14:00 bag drop and unravels the whole Arima afternoon. Be at the keyboard when it opens. ¥1,400, Hankyu Sanbangai 1F.',
    category: 'transport',
    due_date: '2026-08-21',
    is_blocking: true,
  },
  {
    title: '🚌 Reserve the Arima bus RETURN — 10:00, Wed 23 Sep',
    detail:
      'Opens Sun 23 August, one month before boarding — a separate booking from the outbound. Lower stakes than Monday, but this is the service that feeds the 14:00 Kyoto gym slot, so do not leave it. ¥1,400.',
    category: 'transport',
    due_date: '2026-08-23',
    is_blocking: true,
  },
  {
    title: '🎫 Ask about the Hankyu bus + Taiko no Yu combined ticket',
    detail:
      'Hankyu Kanko Bus sells a set: round-trip Osaka ⇄ Arima highway bus PLUS Taiko no Yu admission. You are doing both, and separately they are about ¥2,800 and ¥2,970, so the set should save real money. September is not among the exclusion dates. The catch is the mechanics — reserve first, then pay at a ticket window — so ask the Hankyu Osaka Umeda Tourist Center how that works when reserving from overseas. The reservation is what secures the seat, so paying at the counter on arrival should be fine, but confirm before relying on it.',
    category: 'transport',
    due_date: '2026-08-21',
  },
  {
    title: '🚆 Kintetsu limited express, Kyoto ⇄ Nara for Fri 25 Sep',
    detail:
      'Reserved seating, and Day 7 assumes it. Opens Tue 25 August. Low risk on a Friday morning and you can buy at the station on the day — book only if you want the seat guaranteed.',
    category: 'transport',
    due_date: '2026-08-25',
  },
  {
    title: 'Add ICOCA or Suica to Apple Pay on both phones',
    category: 'admin',
    due_date: '2026-09-05',
  },
  {
    title: 'Pre-pay and pre-weigh Peach baggage, both directions',
    detail: 'LCC. Far cheaper online than at the airport, where excess is punitive.',
    category: 'transport',
    due_date: '2026-09-05',
    is_blocking: true,
  },
  {
    title: 'Download Google Maps offline areas — Osaka, Kyoto, Kobe/Arima, Nara',
    detail:
      'Worth more than any app feature. Navigation, search and directions then work on almost no data. Add Katsuragi for the Taima-dera excursion.',
    category: 'packing',
    due_date: '2026-09-17',
    is_blocking: true,
  },
  {
    title: 'Arrange Singapore airport pickup for ~00:30, Sun 27 Sep',
    detail: 'MM773 lands 00:05, after MRT hours.',
    category: 'transport',
    due_date: '2026-09-12',
  },
  {
    title: 'Confirm travel insurance covers LCC disruption specifically',
    detail: 'Typhoon season is still live on these dates. Full-service delay cover is not enough.',
    category: 'admin',
    due_date: '2026-09-05',
  },
  {
    title: 'Pack for summer — 28–31°C and humid',
    detail:
      'There will be no autumn colours: Kyoto peaks late November. You get the autumn moon, flowers and table, just not the trees. Carry passports for tax-free shopping.',
    category: 'packing',
    due_date: '2026-09-17',
  },

  // ── Hotel bookings — done, with the deadlines that still matter ────────
  {
    title: '⚠️ Dormy Inn Namba free-cancellation ends 17 Sep, 23:59',
    detail:
      'Booked and prepaid, confirmation 1000000000000001. Cancelling after 23:59 on 17 September incurs a cancellation fee. One double room, 2 adults, 19–21 Sep.',
    category: 'booking',
    due_date: '2026-09-17',
  },
  {
    title: '⚠️ Dormy Inn Kyoto free-cancellation ends 22 Sep, 23:59',
    detail:
      'Booked and prepaid, confirmation 1000000000000003. NON-REFUNDABLE after 23:59 on 22 September. One double room, 23–26 Sep.',
    category: 'booking',
    due_date: '2026-09-22',
  },
  {
    title: 'Check the Namba booking is not being charged for two people',
    detail:
      'You are staying alone except at Arima, and the Kyoto voucher correctly says "Occupancy: 1 adult". The Namba voucher says 2 adults on the same one-double-bed room. Nobody is turned away for under-occupancy, but Osaka accommodation tax is charged per person per night, so it is worth a look. Low stakes — the tax on that booking is SGD 6.50 in total.',
    category: 'booking',
    due_date: '2026-09-10',
  },

  // ── Dining ────────────────────────────────────────────────────────────
  {
    title: '🥩 Message Goshobo about meals — and request a NO-BEEF kaiseki',
    detail:
      'Ask: (a) does the rate include meals; (b) cost to add half board for two people, two nights; (c) can it be added to the Trip.com booking or must it be arranged directly; (d) request a seafood-and-vegetable kaiseki for BOTH guests — Arima is the only leg you and your companion share, and the room is booked as one room with two beds. Their fish comes directly from Akashi-Ura port, so seafood is a genuine strength rather than a substitution. Budget impact roughly S$870.',
    category: 'dining',
    due_date: '2026-09-04',
    is_blocking: true,
  },
  {
    title: 'Book Soba Dosanjin as the Arima fallback',
    detail:
      '17:00–20:00, closed Wednesdays, accepts dinner reservations, and it queues. Needed only if the Goshobo kaiseki does not happen.',
    category: 'dining',
    due_date: '2026-09-06',
  },
  {
    title: 'Verify 蕎麦屋薬庵 is open on Sunday 20 Sep',
    detail:
      'Small rural soba shop near Taima-dera, and 20 September is inside Silver Week. If it is shut there is very little else out there — have a backup or bring something.',
    category: 'dining',
    due_date: '2026-09-12',
  },

  // ── Gym ───────────────────────────────────────────────────────────────
  {
    title: '🏋 Check whether either of you has GLOBAL Anytime Fitness access',
    detail:
      'Costs nothing to confirm and would remove every closing-time constraint. Single-club and domestic-only tiers will not open a door in Japan — that is the one that catches people out. Also ask your home club to enable the key fob for international use. Gold’s Kyoto Nijo is 24 hours anyway, so this matters most for Osaka.',
    category: 'admin',
    due_date: '2026-09-05',
  },
  {
    title: 'Plan for Gold’s day passes',
    detail:
      'Nothing to book ahead — walk in with passport, cash and indoor shoes. ¥2,800 a visit, or ¥11,000 for the 10-day Traveller’s Passport, which breaks even at four sessions and includes rental shoes. FIVE sessions are scheduled (19, 20, 23, 24, 25 Sep), so the passport is worth it — ask on day one whether it is valid at Kyoto Nijo as well as Shinsaibashi.',
    category: 'admin',
    due_date: '2026-09-05',
  },
  {
    title: 'Tattoo check before paying for any gym',
    detail:
      'If either of you has one, confirm the policy with Gold’s Shinsaibashi first — their limit is under 15cm × 15cm and covered.',
    category: 'admin',
    due_date: '2026-09-05',
  },
  {
    title: 'Pack a second pair of trainers',
    detail:
      'Indoor-only shoes are mandatory at Japanese gyms and the rule is enforced, not decorative. Also: never drop weights, wipe machines down, and keep tattoos covered.',
    category: 'packing',
    due_date: '2026-09-17',
  },

  // ── Verify closer to the date ─────────────────────────────────────────
  {
    title: 'Confirm Goshobo bath hours and how the two chartered baths are reserved',
    category: 'verify',
    due_date: '2026-09-06',
  },
  {
    title: 'Confirm Taiko no Yu hours and West open-air bath status',
    detail:
      'CLOSURE DATES ARE SETTLED: Taiko no Yu closes 6–7 April, 6–7 July and 13 October in 2026, so it is open on Tue 22 Sep. What is left is the opening hours, the current day-pass rate (~¥2,970) and whether the West open-air bath is in service.',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Reconfirm Kin no Yu / Gin no Yu closure dates at arimaspa-kingin.jp',
    detail:
      'Expected: both open Mon 21 and Tue 22; Kin no Yu SHUT Wed 23 because the holiday shifts its closure.',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Confirm Arima–Rokko Ropeway is not in maintenance closure',
    detail: 'Only matters for the open Tuesday afternoon.',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Confirm Taima-dera opening hours and admission for 20 Sep',
    detail: 'Expected 09:00–17:00, ¥500. It is a Silver Week Sunday.',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Check Nishiki Market closing time on Wed 23',
    detail:
      'Most stalls shut around 18:00 and you arrive at 18:30 after the gym. If it is shut, Teramachi and the Takase river still work — but dinner needs a plan.',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Confirm Gold’s Gym hours for 19–26 Sep',
    detail:
      'Shinsaibashi is Mon–Sat 07:00–23:30 but SUNDAY 09:00–22:00, which is the constraint on the 20th. Kyoto Nijo is 24 hours, closed Sun 21:00 → Mon 07:00 and the 3rd Monday. Reconfirm both.',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Confirm the Peach check-in cutoff for MM773',
    category: 'verify',
    due_date: '2026-09-12',
  },
  {
    title: 'Check holiday opening hours for every Arima restaurant',
    detail:
      '21, 22 and 23 Sep are all national holidays, and small places shift their closing day unpredictably. Tabelog (食べログ) is the definitive directory. See the Restaurant Index.',
    category: 'verify',
    due_date: '2026-09-12',
    is_blocking: true,
  },
]
