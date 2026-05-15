import { nativeImage, type NativeImage } from 'electron'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import type { DisplayStyle } from './types'

// Non-square canvas: 132px wide × 66px tall at @3x → 44pt × 22pt rendered
// Left half (66px) = donut ring, right half (66px) = percentage text
// This keeps menu bar height (22pt) while doubling width for a big, readable icon
const W = 132
const H = 66
const SCALE = 3

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
): void {
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = '#555'
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

// Draw text with a white outline so it reads on both light and dark menu bars
function drawLabel(ctx: SKRSContext2D, text: string, x: number, y: number, font: string): void {
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 3
  ctx.strokeText(text, x, y)
  ctx.fillStyle = '#111111'
  ctx.fillText(text, x, y)
}

function drawDonutStyle(ctx: SKRSContext2D, pct: number): void {
  const cx = H / 2       // center of left half: 33
  const cy = H / 2       // vertical center: 33
  const radius = H / 2 - 7  // 26px — nearly fills the height
  drawDonut(ctx, cx, cy, radius, 12, pct)  // 12px stroke = 4pt rendered, clearly visible

  // Percentage text in the right half
  const tx = W * 0.73    // ~96px from left
  drawLabel(ctx, `${Math.round(pct)}%`, tx, cy, 'bold 26px -apple-system, sans-serif')
}

function drawDualDonutStyle(ctx: SKRSContext2D, sessionPct: number, weeklyPct: number): void {
  const cy = H / 2
  // Two donuts, each centered in a 66px half
  drawDonut(ctx, H / 2, cy, 22, 8, sessionPct)
  drawDonut(ctx, W - H / 2, cy, 22, 8, weeklyPct)

  // S / W labels below each ring
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 2
  ctx.strokeText('S', H / 2, cy + 25)
  ctx.strokeText('W', W - H / 2, cy + 25)
  ctx.fillStyle = '#333'
  ctx.fillText('S', H / 2, cy + 25)
  ctx.fillText('W', W - H / 2, cy + 25)
}

function drawDualNumbersStyle(ctx: SKRSContext2D, sessionPct: number): void {
  // Colored dot only — numbers are set via tray.setTitle()
  const cx = H / 2
  const cy = H / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 10, 0, Math.PI * 2)
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
): NativeImage {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, W, H)

  switch (style) {
    case 'donut':
      drawDonutStyle(ctx, sessionPct)
      break
    case 'dual-donut':
      drawDualDonutStyle(ctx, sessionPct, weeklyPct)
      break
    case 'dual-numbers':
      drawDualNumbersStyle(ctx, sessionPct)
      break
    case 'battery-bar':
      drawBatteryBarStyle(ctx, sessionPct)
      break
  }

  const buf = canvas.toBuffer('image/png')
  return nativeImage.createFromBuffer(buf, { scaleFactor: SCALE })
}
