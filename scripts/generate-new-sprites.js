/**
 * generate-new-sprites.js
 * Creates ARCADE_CABINET (16×32) and WALL_SCREEN (32×16) PNG sprites.
 * Run from repo root: node scripts/generate-new-sprites.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "#rrggbbaa" or "#rrggbb" into [r,g,b,a]. null → transparent */
function hex(color) {
  if (!color) return [0, 0, 0, 0];
  const s = color.replace('#', '');
  if (s.length === 8) {
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
      parseInt(s.slice(6, 8), 16),
    ];
  }
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    255,
  ];
}

/**
 * Build a PNG from a 2D array of color strings (or null for transparent).
 * rows[y][x] = "#rrggbb" | "#rrggbbaa" | null
 */
function buildPNG(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const png = new PNG({ width, height, filterType: -1 });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = hex(rows[y][x]);
      png.data[idx + 0] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

function writePNG(filePath, rows) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const buf = buildPNG(rows);
  fs.writeFileSync(filePath, buf);
  console.log(`  wrote ${filePath} (${rows[0].length}×${rows.length})`);
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const C = {
  // Cabinet body
  bodyDark: '#0f0f1e', // near-black navy — deep cabinet walls
  bodyMid: '#1a1a2e', // base cabinet body
  bodyLift: '#252545', // slightly lighter panel face
  bodyHi: '#3a3a6a', // highlight/edge catch
  trim: '#555577', // metal trim / screws

  // Screen (ARCADE) — green phosphor
  scrBg: '#001a0d', // screen background
  scrDark: '#007744', // dim phosphor
  scrMid: '#00cc66', // mid phosphor
  scrBrt: '#00ff88', // bright phosphor
  scrGlow: '#ccffee', // hottest glow pixel

  // Screen (WALL) — cyan holographic
  wScrBg: '#001428', // screen background
  wScrDark: '#004466', // dim line
  wScrMid: '#0088bb', // mid line
  wScrBrt: '#00ccff', // bright line
  wScrGlow: '#aaeeff', // hotspot

  // Accents
  coinSlot: '#888899', // coin slot metal
  btnRed: '#ff2244', // action button red
  btnYel: '#ffcc00', // action button yellow
  stick: '#aaaacc', // joystick shaft
  white: '#ffffff',
  black: '#000000',
  ledGrn: '#00ff44', // power LED green
  null: null, // transparent
};
const T = null; // shorthand for transparent

// ---------------------------------------------------------------------------
// ARCADE_CABINET — 16 wide × 32 tall
// ---------------------------------------------------------------------------
//
// Row  0- 1  : top cap (rounded silhouette)
// Row  2-10  : screen bezel + glowing CRT
// Row 11-14  : control panel (joystick + buttons)
// Row 15-24  : lower body
// Row 25-31  : base / plinth
//
const ARCADE_ROWS = [
  // row 0 — top cap outer
  [
    T,
    T,
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
    T,
    T,
  ],
  // row 1 — top cap inner
  [
    T,
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
    T,
  ],

  // row 2 — screen bezel top
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 3 — screen top edge + start of CRT
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 4 — screen interior line 1
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.scrBg,
    C.scrDark,
    C.scrDark,
    C.scrMid,
    C.scrBrt,
    C.scrBrt,
    C.scrMid,
    C.scrDark,
    C.scrDark,
    C.scrBg,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 5 — screen interior line 2
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.scrBg,
    C.scrDark,
    C.scrMid,
    C.scrBrt,
    C.scrGlow,
    C.scrGlow,
    C.scrBrt,
    C.scrMid,
    C.scrDark,
    C.scrBg,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 6 — screen interior line 3 (scanline gap)
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.scrBg,
    C.scrDark,
    C.scrDark,
    C.scrDark,
    C.scrMid,
    C.scrMid,
    C.scrDark,
    C.scrDark,
    C.scrDark,
    C.scrBg,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 7 — screen interior line 4
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.scrBg,
    C.scrDark,
    C.scrMid,
    C.scrBrt,
    C.scrBrt,
    C.scrBrt,
    C.scrBrt,
    C.scrMid,
    C.scrDark,
    C.scrBg,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 8 — screen interior line 5 (scanline gap)
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.scrBg,
    C.scrDark,
    C.scrDark,
    C.scrMid,
    C.scrMid,
    C.scrMid,
    C.scrMid,
    C.scrDark,
    C.scrDark,
    C.scrBg,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 9 — screen interior line 6
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.scrBg,
    C.scrDark,
    C.scrMid,
    C.scrMid,
    C.scrBrt,
    C.scrBrt,
    C.scrMid,
    C.scrMid,
    C.scrDark,
    C.scrBg,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 10 — screen bezel bottom
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.scrBg,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],

  // row 11 — control panel top edge (angled panel)
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyHi,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 12 — control panel: joystick + buttons
  [
    C.bodyDark,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.stick,
    C.bodyLift,
    C.bodyLift,
    C.btnRed,
    C.btnYel,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyDark,
  ],
  // row 13 — control panel: joystick base + button row 2
  [
    C.bodyDark,
    C.bodyLift,
    C.bodyLift,
    C.trim,
    C.trim,
    C.trim,
    C.bodyLift,
    C.btnYel,
    C.btnRed,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyDark,
  ],
  // row 14 — control panel bottom edge + coin slot
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.coinSlot,
    C.coinSlot,
    C.coinSlot,
    C.coinSlot,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
  ],

  // row 15 — lower body top
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 16
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 17 — speaker grill dots
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 18
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 19 — speaker grill dots 2
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyLift,
    C.trim,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 20
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 21
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 22 — lower trim strip
  [
    C.bodyDark,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.bodyDark,
  ],
  // row 23
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
  ],
  // row 24
  [
    C.bodyDark,
    C.bodyMid,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyLift,
    C.bodyMid,
    C.bodyDark,
  ],

  // row 25 — base plinth top
  [
    C.bodyDark,
    C.bodyDark,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.trim,
    C.bodyDark,
    C.bodyDark,
  ],
  // row 26
  [
    C.bodyDark,
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
    C.bodyDark,
  ],
  // row 27
  [
    C.bodyDark,
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
    C.bodyDark,
  ],
  // row 28 — feet
  [
    T,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    T,
    T,
    T,
    T,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    T,
  ],
  // row 29
  [
    T,
    C.bodyDark,
    C.trim,
    C.bodyMid,
    C.trim,
    C.bodyDark,
    T,
    T,
    T,
    T,
    C.bodyDark,
    C.trim,
    C.bodyMid,
    C.trim,
    C.bodyDark,
    T,
  ],
  // row 30
  [
    T,
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
    T,
    T,
    T,
    T,
    C.bodyDark,
    C.bodyMid,
    C.bodyMid,
    C.bodyMid,
    C.bodyDark,
    T,
  ],
  // row 31 — floor contact
  [
    T,
    T,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    T,
    T,
    T,
    T,
    T,
    T,
    C.bodyDark,
    C.bodyDark,
    C.bodyDark,
    T,
    T,
  ],
];

// ---------------------------------------------------------------------------
// WALL_SCREEN — 32 wide × 16 tall
// ---------------------------------------------------------------------------
//
// 2px dark bezel all around.
// Interior 28×12 screen with horizontal scan lines (cyan holographic data).
// Bright glow pixels at top-left and top-right inner corners.
// Power LED at bottom-right bezel.
//
const W = (function buildWallScreen() {
  const WIDTH = 32;
  const HEIGHT = 16;

  // Build the grid with transparent default, then paint regions
  const g = [];
  for (let y = 0; y < HEIGHT; y++) {
    g.push(new Array(WIDTH).fill(T));
  }

  function set(x, y, color) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) g[y][x] = color;
  }
  function fillRect(x0, y0, x1, y1, color) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, color);
  }
  function hLine(y, x0, x1, color) {
    for (let x = x0; x <= x1; x++) set(x, y, color);
  }

  // Outer bezel (2px thick dark frame)
  fillRect(0, 0, WIDTH - 1, HEIGHT - 1, C.bodyDark);

  // Bezel inner highlight ring (1px inside bezel)
  hLine(1, 1, WIDTH - 2, C.bodyHi); // top inner
  hLine(HEIGHT - 2, 1, WIDTH - 2, C.bodyMid); // bottom inner
  for (let y = 1; y < HEIGHT - 1; y++) {
    set(1, y, C.bodyHi); // left inner
    set(WIDTH - 2, y, C.bodyMid); // right inner
  }

  // Screen fill (rows 2–13, cols 2–29)
  fillRect(2, 2, 29, 13, C.wScrBg);

  // Horizontal data scan lines — alternating densities
  // Even rows: solid medium line; odd rows: sparse bright flecks
  const lineColors = [
    // y=2
    [
      C.wScrDark,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
      C.wScrDark,
      C.wScrMid,
      C.wScrDark,
      C.wScrDark,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
    ],
    // y=3 (sparse)
    [
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
    ],
    // y=4
    [
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrGlow,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrGlow,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrGlow,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrGlow,
      C.wScrBrt,
      C.wScrMid,
    ],
    // y=5 (sparse)
    [
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
    ],
    // y=6
    [
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrDark,
    ],
    // y=7 (sparse)
    [
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
    ],
    // y=8
    [
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
    ],
    // y=9 (sparse)
    [
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
    ],
    // y=10
    [
      C.wScrDark,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrDark,
    ],
    // y=11 (sparse)
    [
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrMid,
    ],
    // y=12
    [
      C.wScrMid,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrDark,
      C.wScrMid,
      C.wScrBrt,
      C.wScrMid,
      C.wScrMid,
      C.wScrDark,
    ],
    // y=13 (sparse)
    [
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
      C.wScrBg,
      C.wScrDark,
      C.wScrBg,
      C.wScrBg,
    ],
  ];

  for (let i = 0; i < lineColors.length; i++) {
    const y = 2 + i;
    const line = lineColors[i];
    for (let j = 0; j < line.length; j++) {
      set(2 + j, y, line[j]);
    }
  }

  // Corner glow hotspots
  set(2, 2, C.wScrGlow);
  set(3, 2, C.wScrGlow);
  set(2, 3, C.wScrGlow);
  set(29, 2, C.wScrGlow);
  set(28, 2, C.wScrGlow);
  set(29, 3, C.wScrGlow);

  // Power LED — bottom right bezel
  set(28, 14, C.ledGrn);
  set(29, 14, C.ledGrn);

  // Mount bracket indicators — left and right bezel mid
  set(0, 7, C.trim);
  set(0, 8, C.trim);
  set(31, 7, C.trim);
  set(31, 8, C.trim);

  return g;
})();

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------

const REPO = 'C:\\repos\\pixel-agents';

console.log('Generating sprites...');

writePNG(
  `${REPO}\\webview-ui\\public\\assets\\furniture\\ARCADE_CABINET\\ARCADE_CABINET.png`,
  ARCADE_ROWS,
);

writePNG(`${REPO}\\webview-ui\\public\\assets\\furniture\\WALL_SCREEN\\WALL_SCREEN.png`, W);

console.log('Done.');
