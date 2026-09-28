/**
 * Site Index and Restaurant Index — master plan sections 9 and 10, as data.
 * Those two sections are generated from this file by `npm run plan:sync`, so
 * edit here rather than in the markdown.
 *
 * The plan's rule on links is kept exactly: a `url` is a link that was
 * verified. Where there was none, `searchKey` carries the Japanese name to
 * look up instead. A guessed URL that dead-ends in Japan is worse than no URL,
 * so never invent one here.
 */

export type SiteKind =
  | 'SIGHT' | 'ONSEN' | 'MARKET' | 'SHOPPING' | 'THEATRE' | 'FESTIVAL' | 'GARDEN'
  | 'GYM' | 'REFERENCE'

export type SeedSite = {
  name: string
  nameJa?: string
  city: 'Osaka' | 'Arima' | 'Kyoto' | 'Nara' | 'Transport'
  kind: SiteKind
  dayHint?: string
  url?: string
  searchKey?: string
  note?: string
  isOptional?: boolean
  isHighlight?: boolean
  isAvoid?: boolean
}

export type SeedRestaurant = {
  name: string
  nameJa?: string
  city: 'Arima' | 'Osaka' | 'Kyoto' | 'Nara' | 'Seasonal'
  kind?: 'PLACE' | 'DISH'
  cuisine?: string
  hours?: string
  note?: string
  url?: string
  searchKey?: string
  needsBooking?: boolean
  isAvoid?: boolean
  isHighlight?: boolean
}

export const SITES: SeedSite[] = [
  // ── Osaka · 19–21 Sep ──────────────────────────────────────────────────
  { name: 'Kuromon Ichiba Market', nameJa: '黒門市場', city: 'Osaka', kind: 'MARKET', dayHint: 'Sat 19', searchKey: '黒門市場', note: 'Grill-to-order stalls. Eat standing up.' },
  { name: 'Dotonbori', nameJa: '道頓堀', city: 'Osaka', kind: 'SIGHT', dayHint: 'Sat 19', searchKey: '道頓堀', note: 'Three minutes from the hotel. Glico runner, mechanical crab.' },
  { name: 'Shinsekai & Tsutenkaku', nameJa: '新世界 · 通天閣', city: 'Osaka', kind: 'SIGHT', dayHint: 'Sun 20', searchKey: '通天閣', note: '1950s Osaka preserved in amber. Given up if the matinee happens.' },
  { name: 'Hozenji Yokocho', nameJa: '法善寺横丁', city: 'Osaka', kind: 'SIGHT', dayHint: 'Sun 20', searchKey: '法善寺横丁', note: 'Lantern-lit stone lanes minutes from Dotonbori.' },

  { name: 'Taima-dera', nameJa: '當麻寺', city: 'Osaka', kind: 'SIGHT', dayHint: 'Sun 20', searchKey: '當麻寺', note: 'Katsuragi, Nara prefecture — Kintetsu Minami-Osaka line from Osaka-Abenobashi, ~40 min, then 15 min on foot. 09:00–17:00, ¥500. The only temple in Japan with both original Nara-period pagodas still standing.', isHighlight: true },
  { name: 'Shitennō-ji', nameJa: '四天王寺', city: 'Osaka', kind: 'SIGHT', dayHint: 'Sun 20', searchKey: '四天王寺', note: 'Founded 593 — the first state-built Buddhist temple in Japan. Outer grounds free; garden and inner precinct charged separately.' },
  { name: 'Isshin-ji', nameJa: '一心寺', city: 'Osaka', kind: 'SIGHT', dayHint: 'Sun 20', searchKey: '一心寺', note: 'Ten minutes from Shitennō-ji. Okotsubutsu — Buddha images made from the ashes of the dead — behind a startlingly modern gate.' },
  { name: 'Tsutenkaku Hondori Shopping Street', nameJa: '通天閣本通商店街', city: 'Osaka', kind: 'SHOPPING', dayHint: 'Sun 20', searchKey: '通天閣本通商店街', note: '1950s Osaka preserved in amber. Kushikatsu is the signature — no double dipping in the communal sauce.' },
  { name: 'Hankyu Sanban Gai', nameJa: '阪急三番街', city: 'Osaka', kind: 'SHOPPING', dayHint: 'Mon 21 / Wed 23', searchKey: '阪急三番街', note: 'Shopping above, a great depachika below, and the Arima highway bus terminal on 1F. All three on the same site.', isHighlight: true },

  // ── Arima Onsen · 21–23 Sep ────────────────────────────────────────────
  { name: 'Taiko no Yu', nameJa: '太閤の湯', city: 'Arima', kind: 'ONSEN', dayHint: 'Tue 22', searchKey: '有馬温泉 太閤の湯', note: '26 baths across kinsen, ginsen and carbonated. Go at 10:00 opening; book the bedrock bath early.', isHighlight: true },
  { name: 'Kin no Yu', nameJa: '金の湯', city: 'Arima', kind: 'ONSEN', dayHint: 'Mon 21 / Tue 22', url: 'https://arimaspa-kingin.jp/', note: 'The iron-brown kinsen at the centre of town, with a free ashiyu foot bath outside. Open Mon 21 and Tue 22; SHUT Wed 23, because the holiday shifts its usual Tuesday closure.', isHighlight: true },
  { name: 'Zuiho-ji Park', nameJa: '瑞宝寺公園', city: 'Arima', kind: 'GARDEN', dayHint: 'Mon 21 / Tue 22', searchKey: '瑞宝寺公園' },
  { name: 'Ashiyu foot baths & old streets', nameJa: '有馬温泉 足湯', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬温泉 湯本坂', note: 'Free foot baths, tansan senbei.' },
  { name: 'Arima–Rokko Ropeway', nameJa: '六甲有馬ロープウェー', city: 'Arima', kind: 'SIGHT', dayHint: 'Tue 22', searchKey: '六甲有馬ロープウェー', note: 'Confirm it is not in maintenance closure.', isOptional: true },
  { name: 'Arima ryokan availability', city: 'Arima', kind: 'REFERENCE', url: 'https://www.ikyu.com/en-us/onsen/280050/si24/', note: 'Reference only.' },

  { name: 'Arima Toys and Automata Museum', nameJa: '有馬玩具博物館', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬玩具博物館', note: 'Six floors of German and Czech automata, tin toys and karakuri puppets. ¥800. More interesting than the name suggests.' },
  { name: 'Tenjin Hot Spring Source', nameJa: '天神泉源', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬温泉 天神泉源', note: 'A minute from Goshobo, behind Tenjin shrine. Steam straight off the 98°C kinsen. Free.' },
  { name: 'Gosho Hot Spring Source', nameJa: '御所泉源', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬温泉 御所泉源', note: 'The second of the three springheads. Free.' },
  { name: 'Gokuraku Hot Spring Source', nameJa: '極楽泉源', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬温泉 極楽泉源', note: 'The third, beside Gokuraku-ji. All three sit within a few hundred metres. Free.' },
  { name: 'Onsen-ji', nameJa: '温泉寺', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬温泉寺', note: 'The temple at the heart of Arima, founded in the 8th century by Gyoki, who is credited with reviving the springs. Holds an important Yakushi Nyorai, the medicine Buddha.' },
  { name: 'Nenbutsu-ji', nameJa: '念仏寺', city: 'Arima', kind: 'SIGHT', dayHint: 'Mon 21', searchKey: '有馬温泉 念仏寺', note: 'Next door to Onsen-ji. A 250-year-old sarusuberi in the courtyard and a valley view almost nobody stops for.' },
  { name: 'Gin no Yu', nameJa: '銀の湯', city: 'Arima', kind: 'ONSEN', dayHint: 'Mon 21', searchKey: '有馬温泉 銀の湯', note: 'The clear carbonated-radium ginsen — colourless and much lighter than the kinsen. Closes 1st and 3rd Tuesdays. ¥1,200 combination ticket covers both baths.' },

  // ── Kyoto · 23–26 Sep ──────────────────────────────────────────────────
  { name: 'Nishiki Market', nameJa: '錦市場', city: 'Kyoto', kind: 'MARKET', dayHint: 'Wed 23', searchKey: '錦市場', note: "Kyoto's kitchen. Graze rather than eat a meal." },
  { name: 'Teramachi & Shinkyogoku arcades', nameJa: '寺町通 · 新京極', city: 'Kyoto', kind: 'SHOPPING', dayHint: 'Wed 23', searchKey: '新京極商店街', note: 'A bonus stroll, not a destination. Osaka is far stronger.' },
  { name: 'Fushimi Inari Taisha', nameJa: '伏見稲荷大社', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', url: 'https://inari.jp/en/', note: '07:00 start. Climb to Yotsutsuji, leave by 09:30. JNTO: japan.travel/en/spot/1128/', isHighlight: true },
  { name: 'Kiyomizu-dera', nameJa: '清水寺', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', url: 'http://www.kiyomizudera.or.jp/en/', note: 'The wooden stage over the hillside. JNTO: japan.travel/en/spot/2199/', isHighlight: true },
  { name: 'Sannenzaka & Ninenzaka', nameJa: '三年坂 · 二年坂', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', searchKey: '産寧坂', note: 'The most photogenic streets in the city.' },
  { name: 'Gion', nameJa: '祇園', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', searchKey: '祇園', note: 'The private alleys off Hanamikoji are closed to tourists and carry fines. Stay on the main streets.' },

  { name: 'Ninenzaka', nameJa: '二年坂', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', searchKey: '二年坂', note: 'The lower preserved slope, with teahouses and the machiya Starbucks.' },
  { name: 'Kōdai-ji', nameJa: '高台寺', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', searchKey: '高台寺', note: 'Built 1606 for Nene, widow of Hideyoshi. Momoyama lacquer, two of the finest teahouses in Japan, and a bamboo grove far quieter than Arashiyama. ¥600.', isHighlight: true },
  { name: 'Kennin-ji', nameJa: '建仁寺', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', searchKey: '建仁寺', note: 'The oldest Zen temple in Kyoto, founded 1202. Twin dragons on the Hatto ceiling and a dry garden almost nobody queues for. ¥600.' },
  { name: 'Chion-in', nameJa: '知恩院', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Thu 24', searchKey: '知恩院', note: 'Head temple of Pure Land Buddhism. The Sanmon is the largest wooden gate in Japan, and the grounds stay free after the halls close.', isHighlight: true },
  { name: 'Takase River', nameJa: '高瀬川', city: 'Kyoto', kind: 'SIGHT', dayHint: 'Wed 23', searchKey: '高瀬川 木屋町', note: 'Willow-lined canal beside Kiyamachi, lit at night and quieter than Pontocho alongside it.' },
  { name: 'Kyoto Station — Isetan and Porta', nameJa: '京都駅 伊勢丹 · ポルタ', city: 'Kyoto', kind: 'SHOPPING', dayHint: 'Sat 26', searchKey: '京都駅 ポルタ', note: 'Isetan depachika B1–B2 for premium confections and regional gifts; Porta underground for casual shopping. Kyoto Ramen Koji is on the 10th floor.', isHighlight: true },

  // ── Nara · Fri 25 Sep ──────────────────────────────────────────────────
  { name: 'Nara Park & the deer', nameJa: '奈良公園', city: 'Nara', kind: 'SIGHT', dayHint: 'Fri 25', searchKey: '奈良公園', note: 'Buy shika-senbei and expect to be mobbed.' },
  { name: 'Todai-ji — Great Buddha Hall', nameJa: '東大寺', city: 'Nara', kind: 'SIGHT', dayHint: 'Fri 25', searchKey: '東大寺', note: 'Among the largest wooden buildings in the world.' },
  { name: 'Kasuga Taisha — lantern approach', nameJa: '春日大社', city: 'Nara', kind: 'SIGHT', dayHint: 'Fri 25', searchKey: '春日大社' },

  // ── Gyms · master plan section 8 ───────────────────────────────────────
  // Ratings and hours are from Google Places, July 2026 — reconfirm before you
  // go. Walk times are from the respective Dormy Inn.
  {
    name: "Gold's Gym Shinsaibashi", nameJa: 'ゴールドジム 心斎橋大阪', city: 'Osaka', kind: 'GYM',
    dayHint: 'Sat 19 / Sun 20', searchKey: 'ゴールドジム 心斎橋大阪',
    note: "Nishishinsaibashi 1-6-14, BIG STEP 6F · ~5 min walk · Mon–Sat 07:00–23:30, SUN 09:00–22:00 · ¥2,800 day pass, or ¥11,000 for a 10-day Traveler's Passport (breaks even at four visits, includes rental shoes) · 3.7 from 135 reviews — the lowest-rated option in Namba, and reviews on how foreigners are treated are split. Bring cash and your passport.",
    isHighlight: true,
  },
  {
    name: 'Torque Gym Namba', nameJa: 'トルクジム難波', city: 'Osaka', kind: 'GYM',
    dayHint: 'Sat 19 / Sun 20', searchKey: 'トルクジム 難波',
    note: 'Nanbasennichimae 15-15, 6F · ~11 min · 24/7 · 4.8 from 657 reviews — the highest-rated gym in the area, IFBB pros train here. Full free-weight floor, squat and power racks. Only three treadmills. ~¥6,600 a week staffed-hours. Bring your own shoes, rental is expensive.',
    isHighlight: true,
  },
  {
    name: 'Urbanfit 24 Namba', nameJa: 'アーバンフィット24 難波店', city: 'Osaka', kind: 'GYM',
    dayHint: 'Sat 19 / Sun 20', searchKey: 'アーバンフィット24 難波',
    note: "Motomachi 1-11-11, Naniwa-ku · ~14 min · 24/7 · 4.4 from 337 reviews · THE VALUE PICK: ~¥2,350–2,530 day pass INCLUDING towel, drinking water and shower — cheaper than Gold's and it covers what Gold's charges for. Bring your passport.",
    isHighlight: true,
  },
  {
    name: 'Anytime Fitness Shinsaibashi', nameJa: 'エニタイムフィットネス 心斎橋店', city: 'Osaka', kind: 'GYM',
    dayHint: 'members only', searchKey: 'エニタイムフィットネス 心斎橋',
    note: 'Minamisemba 2-12-16, Le Grand Shinsaibashi B1 · ~6 min · 24/7 · 4.2 from 59 reviews · Dumbbells to 50kg. NO FREE WATER — a refill costs ¥500, so bring your own. Free on an existing global membership.',
  },
  {
    name: 'Anytime Fitness Imamiyaebisu', nameJa: 'エニタイムフィットネス 今宮戎店', city: 'Osaka', kind: 'GYM',
    dayHint: 'members only', searchKey: 'エニタイムフィットネス 今宮戎',
    note: 'Shikitsuhigashi 2-1-10, Naniwa-ku · ~21 min · 24/7 · 4.1 from 378 reviews · Dumbbells to 50kg.',
    isOptional: true,
  },
  {
    name: "Gold's Gym Kyoto Nijo", nameJa: 'ゴールドジム 京都二条', city: 'Kyoto', kind: 'GYM',
    dayHint: 'Wed 23 / Thu 24 / Fri 25', searchKey: 'ゴールドジム 京都二条',
    note: 'INSIDE JR Nijo Station (NK Bldg 2F), Nishinokyo Higashitogao-cho 3, Nakagyo-ku · JR Sagano line, 2 stops from Kyoto Station, with no walk at the far end · OPEN 24 HOURS. Closed Sun 21:00 → Mon 07:00 and the 3rd Monday of the month — neither hits your Kyoto days.',
    isHighlight: true,
  },
  {
    name: "Gold's Gym Kyoto Karasuma", nameJa: 'ゴールドジム 京都烏丸', city: 'Kyoto', kind: 'GYM',
    dayHint: 'alternative', searchKey: 'ゴールドジム 京都烏丸',
    note: 'Karasuma Bldg 2F, Nakagyo-ku · Karasuma line to Shijo, 2 stops, then 3 min on foot · Mon–Sat 07:00–23:00, Sun 07:00–21:00, closed the 2nd Monday · 4.0 from 357 reviews. CLOSER THAN NIJO in metres (~2.1 km against ~3.4 km), but it has a walk at the far end and shuts at 23:00 — Nijo is inside its own station and open 24 hours, which is why it is the default.',
    isOptional: true,
  },
  {
    name: 'Anytime Fitness Shijo-Kawaramachi', nameJa: 'エニタイムフィットネス 四条河原町店', city: 'Kyoto', kind: 'GYM',
    dayHint: 'members only', searchKey: 'エニタイムフィットネス 四条河原町',
    note: 'TM Shijo Teramachi Bldg 3F, Shimogyo-ku · Karasuma line to Shijo, then walk east · 24/7 · 4.5 from 239 reviews — the best-rated Kyoto option. Repeatedly described by reviewers as tattoo friendly, which is unusual in Japan.',
    isHighlight: true,
  },
  {
    name: 'Anytime Fitness Shijo', nameJa: 'エニタイムフィットネス 四条店', city: 'Kyoto', kind: 'GYM',
    dayHint: 'members only', searchKey: 'エニタイムフィットネス 四条 京都',
    note: 'Hakurakutencho 530-1, Shimogyo-ku · 24/7 · 3.8 from 142 reviews · Dumbbells only reach 30kg here, unlike the Osaka branches.',
    isOptional: true,
  },
  {
    name: 'Anytime Fitness Sanjokarasuma', nameJa: 'エニタイムフィットネス 三条烏丸店', city: 'Kyoto', kind: 'GYM',
    searchKey: 'エニタイムフィットネス 三条烏丸',
    note: 'AVOID. Multiple reviewers report hostility toward foreign visitors, including being threatened with restrictions on their home-country membership. 3.3 from 64 reviews, well below every other option. Shijo-Kawaramachi is minutes away and rated 4.5.',
    isAvoid: true,
  },

  // ── Transport & booking references ─────────────────────────────────────
  { name: 'Haruka discounted ticket (e-ticket)', city: 'Transport', kind: 'REFERENCE', url: 'https://us.trip.com/things-to-do/detail/87364606/' },
  { name: 'Haruka ticket (collect at machine)', city: 'Transport', kind: 'REFERENCE', url: 'https://www.trip.com/things-to-do/detail/17263458/' },
  { name: 'Hankyu highway bus, Umeda ⇄ Arima', city: 'Transport', kind: 'REFERENCE', searchKey: '阪急バス 有馬温泉 大阪梅田', note: 'Reserve both directions together.' },
  { name: 'Tocen Goshobo (booked)', nameJa: '有馬温泉 陶泉 御所坊', city: 'Transport', kind: 'REFERENCE', searchKey: '有馬温泉 陶泉 御所坊', note: 'Booking 1000000000000002.' },
]

export const RESTAURANTS: SeedRestaurant[] = [
  // ── Arima — the one that needs planning ────────────────────────────────
  { name: 'Soba Dosanjin', nameJa: '蕎麦 土山人', city: 'Arima', cuisine: 'Soba, tempura', hours: '11:00–15:00 · 17:00–20:00, closed Wed', note: 'THE PICK. Sudachi soba. 1056 Arima-cho, 6 min from the station. Accepts dinner reservations — book. Private room upstairs.', searchKey: '有馬 土山人', needsBooking: true, isHighlight: true },
  { name: 'Aramiya', nameJa: 'あら井', city: 'Arima', cuisine: 'Izakaya', hours: 'Evening', note: 'Nearest izakaya to Kin no Yu. Sashimi, tempura, onigiri, tai-chazuke. Works as a full dinner. Casual, cheap, open late.', searchKey: '有馬温泉 あら井' },
  { name: 'Arima 18-ban', nameJa: '有馬十八番', city: 'Arima', cuisine: 'Local', hours: 'Daytime', note: 'Shirasu rice bowl and akashiyaki. No beef.', searchKey: '有馬十八番' },
  { name: 'Taiko no Yu dining', nameJa: '太閤の湯', city: 'Arima', cuisine: 'Complex restaurants', hours: 'to 22:00', note: 'The most reliable evening option in Arima — you are there all Tuesday anyway.', searchKey: '有馬温泉 太閤の湯' },
  { name: 'Pan du Bo', nameJa: 'パン・ド・ボー', city: 'Arima', cuisine: 'Bakery', hours: '09:00 until sold out', note: 'Normally closed Tue, but shifts to Wed when Tuesday is a holiday — so OPEN for you on Tue 22.', searchKey: '有馬温泉 パンドボー' },
  { name: 'Houkyuuan', nameJa: '宝橘庵', city: 'Arima', cuisine: 'Bakery', hours: '10:00–18:00', note: 'Tanba black bean, Arima sansho and kinsen salt breads. Sells out by mid-afternoon.', searchKey: '有馬温泉 宝橘庵' },
  { name: 'Gekkoen Yugetsusanso', nameJa: '月光園 遊月山荘', city: 'Arima', note: 'AVOID. Dinner by reservation only at 17:45 or 19:30, and explicitly not served on public holidays — which rules out both your nights.', isAvoid: true },
  { name: 'Hankyu Umeda depachika', nameJa: '阪急うめだ本店 地下', city: 'Arima', cuisine: 'Bento', note: "Buy Monday's dinner here before boarding the bus. Directly below the Sanbangai bus terminal.", searchKey: '阪急うめだ本店 地下', isHighlight: true },

  // ── Osaka ──────────────────────────────────────────────────────────────
  { name: 'Wanaka', nameJa: 'たこ焼道楽わなか', city: 'Osaka', cuisine: 'Takoyaki', searchKey: 'たこ焼道楽わなか' },
  { name: 'Kukuru', nameJa: 'たこ家道頓堀くくる', city: 'Osaka', cuisine: 'Takoyaki', searchKey: 'たこ家道頓堀くくる' },
  { name: 'Chibo', nameJa: '千房', city: 'Osaka', cuisine: 'Okonomiyaki', searchKey: '千房 道頓堀' },
  { name: 'Mizuno', nameJa: '美津の', city: 'Osaka', cuisine: 'Okonomiyaki', searchKey: '美津の 道頓堀' },
  { name: 'Daruma', nameJa: '串カツだるま', city: 'Osaka', cuisine: 'Kushikatsu', note: 'NO DOUBLE DIPPING in the communal sauce — take cabbage to scoop more.', searchKey: '串カツだるま 新世界', isHighlight: true },
  { name: '551 Horai', nameJa: '551蓬莱', city: 'Osaka', cuisine: 'Butaman pork buns', searchKey: '551蓬莱' },
  { name: "Rikuro's", nameJa: 'りくろーおじさんの店', city: 'Osaka', cuisine: 'Jiggly cheesecake', searchKey: 'りくろーおじさんの店' },
  { name: 'Kuromon Ichiba stalls', nameJa: '黒門市場', city: 'Osaka', cuisine: 'Seafood', note: 'Grilled scallops, uni, otoro, wagyu skewers.', searchKey: '黒門市場' },
  { name: 'Hozenji Yokocho', nameJa: '法善寺横丁', city: 'Osaka', cuisine: 'Dinner alley', note: 'Lantern-lit lanes, a completely different register to Dotonbori.', searchKey: '法善寺横丁' },

  // ── Kyoto ──────────────────────────────────────────────────────────────
  { name: 'Nishiki Market — Miki Keiran', nameJa: '錦市場 · 三木鶏卵', city: 'Kyoto', cuisine: 'Tamagoyaki', searchKey: '三木鶏卵' },
  { name: 'Pontocho obanzai', nameJa: '先斗町 · おばんざい', city: 'Kyoto', cuisine: 'Obanzai', note: 'Wed 23 dinner. Kyoto home-style small plates — the authentic and affordable choice. Book ahead.', searchKey: '先斗町 おばんざい', needsBooking: true, isHighlight: true },
  { name: 'Honke Daiichi Asahi', nameJa: '本家第一旭', city: 'Kyoto', cuisine: 'Kyoto ramen', note: 'Near Kyoto Station.', searchKey: '本家第一旭' },
  { name: 'Yudofu, Nanzen-ji area', nameJa: '湯豆腐', city: 'Kyoto', kind: 'DISH', cuisine: 'Simmered tofu', note: 'Thu 24 lunch, in a garden setting. Nanzen-ji is its traditional home.', searchKey: '南禅寺 湯豆腐' },
  { name: 'Nishin soba', nameJa: 'にしんそば', city: 'Kyoto', kind: 'DISH', note: 'Buckwheat noodles with sweet-simmered herring. Gion dinner.' },
  { name: 'Saba-zushi', nameJa: '鯖寿司', city: 'Kyoto', kind: 'DISH', note: 'Pressed mackerel sushi.' },
  { name: 'Inari-zushi at Fushimi Inari', nameJa: 'いなり寿司', city: 'Kyoto', kind: 'DISH', note: 'Thu 24 breakfast at the shrine-approach stalls. It originates here.' },
  { name: 'Warabimochi / yatsuhashi', nameJa: 'わらび餅 · 八ツ橋', city: 'Kyoto', kind: 'DISH', note: 'Sweets and souvenirs.' },

  // ── Nara ───────────────────────────────────────────────────────────────
  { name: 'Nakatanidou', nameJa: '中谷堂', city: 'Nara', cuisine: 'Mochi', note: 'High-speed mochi pounding as live performance, several times a day. Near Sanjo-dori — time your walk around it.', searchKey: '中谷堂', isHighlight: true },
  { name: 'Kakinoha-zushi', nameJa: '柿の葉寿司', city: 'Nara', kind: 'DISH', note: 'Persimmon-leaf sushi, the regional specialty.' },
  { name: 'Narazuke', nameJa: '奈良漬', city: 'Nara', kind: 'DISH', note: 'Sake-lees pickles.' },

  // ── Order these if you see them ────────────────────────────────────────
  { name: 'Sanma', nameJa: '秋刀魚', city: 'Seasonal', kind: 'DISH', note: 'Pacific saury grilled whole with salt and grated daikon. The definitive taste of Japanese autumn.', isHighlight: true },
  { name: 'Matsutake', nameJa: '松茸', city: 'Seasonal', kind: 'DISH', note: 'Especially in dobin-mushi.' },
  { name: 'Kuri', nameJa: '栗', city: 'Seasonal', kind: 'DISH', note: 'Chestnuts, in rice or as kuri-kinton.' },
  { name: 'Shinmai', nameJa: '新米', city: 'Seasonal', kind: 'DISH', note: 'The first rice of the new harvest.' },
  { name: 'Tsukimi items', nameJa: '月見', city: 'Seasonal', kind: 'DISH', note: 'Appear nationwide around the 25th. Usually a raw egg yolk standing in for the moon.' },
]
