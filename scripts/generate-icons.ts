/**
 * Generates the PWA icons as PNGs, with no image library.
 *
 * A dependency for four static files is not worth it, and zlib is built in —
 * a PNG is just a few chunks around a deflated scanline buffer.
 *
 * Run: npm run icons
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

type RGBA = [number, number, number, number]

const INK: RGBA = [250, 250, 249, 255] // stone-50
const GROUND: RGBA = [28, 25, 23, 255] // stone-900
const VERMILION: RGBA = [220, 74, 46, 255] // torii red

function crc32(buf: Buffer): number {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}

function encodePng(size: number, pixel: (x: number, y: number) => RGBA): Buffer {
  // Each scanline is prefixed with a filter byte; 0 means "none".
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * A torii gate. Drawn from rectangles in normalised coordinates so it scales
 * to any size, with `inset` leaving the safe area a maskable icon needs —
 * Android crops to a circle, and an uncropped mark looks clipped.
 */
function torii(size: number, opts: { bg: RGBA; fg: RGBA; inset: number }) {
  const { bg, fg, inset } = opts
  const s = size
  const pad = inset * s
  const w = s - pad * 2

  // Proportions of the gate within the safe area.
  const kasagiY = pad + w * 0.16 // top beam
  const kasagiH = w * 0.1
  const kasagiX = pad + w * 0.02
  const kasagiW = w * 0.96

  const nukiY = pad + w * 0.36 // second beam
  const nukiH = w * 0.075
  const nukiX = pad + w * 0.13
  const nukiW = w * 0.74

  const pillarW = w * 0.115
  const pillarTop = kasagiY
  const pillarBottom = pad + w * 0.9
  const leftX = pad + w * 0.19
  const rightX = pad + w * 0.81 - pillarW

  const inRect = (x: number, y: number, rx: number, ry: number, rw: number, rh: number) =>
    x >= rx && x < rx + rw && y >= ry && y < ry + rh

  return (x: number, y: number): RGBA => {
    if (
      inRect(x, y, kasagiX, kasagiY, kasagiW, kasagiH) ||
      inRect(x, y, nukiX, nukiY, nukiW, nukiH) ||
      inRect(x, y, leftX, pillarTop, pillarW, pillarBottom - pillarTop) ||
      inRect(x, y, rightX, pillarTop, pillarW, pillarBottom - pillarTop)
    ) {
      return fg
    }
    return bg
  }
}

const out = join(process.cwd(), 'public', 'icons')
mkdirSync(out, { recursive: true })

const files: [string, number, Parameters<typeof torii>[1]][] = [
  // Maskable: generous inset, because Android crops to a circle.
  ['icon-192.png', 192, { bg: GROUND, fg: VERMILION, inset: 0.16 }],
  ['icon-512.png', 512, { bg: GROUND, fg: VERMILION, inset: 0.16 }],
  // iOS does not mask, so it can breathe closer to the edge.
  ['apple-touch-icon.png', 180, { bg: GROUND, fg: VERMILION, inset: 0.1 }],
  // Monochrome, for the browser tab.
  ['favicon-32.png', 32, { bg: GROUND, fg: INK, inset: 0.06 }],
]

for (const [name, size, opts] of files) {
  writeFileSync(join(out, name), encodePng(size, torii(size, opts)))
  console.log(`  ${name.padEnd(22)} ${size}×${size}`)
}
console.log(`\n✓ ${files.length} icons written to public/icons`)
