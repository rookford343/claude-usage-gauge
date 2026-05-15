import { nativeImage, type NativeImage } from 'electron'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import type { DisplayStyle } from './types'

// SCALE=3 styles: H=66 canvas → 22pt rendered height
const W = 132   // battery-bar canvas width (44pt)
const H = 66    // canvas height for SCALE=3 styles (22pt rendered)
const SCALE = 3

// Dual-donut uses SCALE=2 so fonts render at 2× the pt size vs SCALE=3.
// HD=44 → 22pt rendered height (same as menu bar).
// WD=168 → 84pt rendered width — fits numbers + rings + divider with legible text.
const WD = 168  // dual-donut canvas width
const HD = 44   // dual-donut canvas height
const SCALE_D = 2

interface Palette {
  track: string
  divider: string
  textStroke: string
  textFill: string
}

const DARK_PALETTE: Palette = {
  track: '#555',
  divider: '#666',
  textStroke: 'rgba(255,255,255,0.85)',
  textFill: '#111111',
}

const LIGHT_PALETTE: Palette = {
  track: '#BBBBBB',
  divider: '#AAAAAA',
  textStroke: 'rgba(0,0,0,0.7)',
  textFill: '#FFFFFF',
}

function usageColor(pct: number): string {
  if (pct < 50) return '#22C55E'
  if (pct < 80) return '#EAB308'
  return '#EF4444'
}

function drawDonut(
  ctx: SKRSContext2D,
  cx: number,
  cy: number,
  radius: number,
  lineWidth: number,
  pct: number,
  palette: Palette,
): void {
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = palette.track
  ctx.lineWidth = lineWidth
  ctx.stroke()

  if (pct > 0) {
    const sweep = (pct / 100) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + sweep)
    ctx.strokeStyle = usageColor(pct)
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }
}


function drawDonutStyle(ctx: SKRSContext2D, pct: number, palette: Palette): void {
  // Square canvas (H×H) — text is shown via tray.setTitle(), not drawn here
  const cx = H / 2
  const cy = H / 2
  const radius = H / 2 - 7
  drawDonut(ctx, cx, cy, radius, 12, pct, palette)
}

// Draw outlined text readable on both light and dark menu bars
function drawOutlinedText(ctx: SKRSContext2D, text: string, x: number, y: number, palette: Palette): void {
  ctx.strokeStyle = palette.textStroke
  ctx.lineWidth = 3
  ctx.strokeText(text, x, y)
  ctx.fillStyle = palette.textFill
  ctx.fillText(text, x, y)
}

function drawDualDonutStyle(ctx: SKRSContext2D, sessionPct: number, weeklyPct: number, palette: Palette): void {
  // Canvas is WD=168 × HD=44 at SCALE_D=2 → renders as 84×22pt.
  // At SCALE=2, a 22px canvas font renders as 11pt — clearly readable.
  const cy = HD / 2   // 22
  const radius = 14
  const stroke = 7
  // outer edge from center = radius + stroke/2 = 17.5
  // Number zone: x=0–36 (session) and x=132–168 (weekly) → 36px each
  // Donut centers: 36 + 4(gap) + 17.5(outerR) = 57.5 → cxS=58, cxW=110
  // Divider at x=84 (WD/2). Left outer right=75.5, right outer left=92.5 → 8.5px each side ✓
  const cxS = 58
  const cxW = 110

  drawDonut(ctx, cxS, cy, radius, stroke, sessionPct, palette)
  drawDonut(ctx, cxW, cy, radius, stroke, weeklyPct, palette)

  // Vertical divider at canvas center
  ctx.beginPath()
  ctx.moveTo(WD / 2, cy - 16)
  ctx.lineTo(WD / 2, cy + 16)
  ctx.strokeStyle = palette.divider
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // S / W inside rings — 20px canvas = 10pt rendered at SCALE=2
  // inner hole diameter = (radius - stroke/2)*2 = 21px → 10.5pt, cap height ≈ 14px fits ✓
  ctx.font = 'bold 20px -apple-system, sans-serif'
  drawOutlinedText(ctx, 'S', cxS, cy, palette)
  drawOutlinedText(ctx, 'W', cxW, cy, palette)

  // Flanking percentages — 22px canvas = 11pt rendered at SCALE=2, clearly legible
  ctx.font = 'bold 22px -apple-system, sans-serif'
  drawOutlinedText(ctx, `${sessionPct}%`, 18, cy, palette)
  drawOutlinedText(ctx, `${weeklyPct}%`, WD - 18, cy, palette)
}

function drawDualNumbersStyle(ctx: SKRSContext2D, sessionPct: number): void {
  // Colored dot in a square canvas (H×H) — numbers are set via tray.setTitle()
  // Dot is centered so it sits immediately left of the setTitle text
  const cx = H / 2
  const cy = H / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 14, 0, Math.PI * 2)  // 14px radius = 4.7pt rendered — clearly visible
  ctx.fillStyle = usageColor(sessionPct)
  ctx.fill()
}

function drawBatteryBarStyle(ctx: SKRSContext2D, pct: number): void {
  const segments = 10
  const segW = 10
  const segH = 24
  const gap = 2
  const totalW = segments * segW + (segments - 1) * gap
  const startX = (W - totalW) / 2
  const startY = (H - segH) / 2
  const filled = Math.round((pct / 100) * segments)

  for (let i = 0; i < segments; i++) {
    const x = startX + i * (segW + gap)
    ctx.fillStyle = i < filled ? usageColor(pct) : '#444'
    ctx.beginPath()
    ctx.roundRect(x, startY, segW, segH, 2)
    ctx.fill()
  }
}

export function drawTrayIcon(
  sessionPct: number,
  style: DisplayStyle,
  weeklyPct = 0,
  isDark = true,
): NativeImage {
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE
  const isDualDonut = style === 'dual-donut'
  const canvasW = isDualDonut ? WD : style === 'battery-bar' ? W : H
  const canvasH = isDualDonut ? HD : H
  const scaleFactor = isDualDonut ? SCALE_D : SCALE

  const canvas = createCanvas(canvasW, canvasH)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvasW, canvasH)

  switch (style) {
    case 'donut':
      drawDonutStyle(ctx, sessionPct, palette)
      break
    case 'dual-donut':
      drawDualDonutStyle(ctx, sessionPct, weeklyPct, palette)
      break
    case 'dual-numbers':
      drawDualNumbersStyle(ctx, sessionPct)
      break
    case 'battery-bar':
      drawBatteryBarStyle(ctx, sessionPct)
      break
  }

  const buf = canvas.toBuffer('image/png')
  return nativeImage.createFromBuffer(buf, { scaleFactor })
}
