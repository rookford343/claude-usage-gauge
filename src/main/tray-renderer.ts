import { nativeImage, type NativeImage } from 'electron'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import type { DisplayStyle } from './types'

// 66px canvas declared as @3x → renders at 22pt on all Retina displays
// More pixels-per-point means text and arcs render crisply
const SIZE = 66
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

function drawDonutStyle(ctx: SKRSContext2D, pct: number): void {
  const cx = SIZE / 2
  const cy = SIZE / 2
  // Thinner ring leaves more room for the label
  const radius = SIZE / 2 - 9
  drawDonut(ctx, cx, cy, radius, 6, pct)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Show just the number — "%" takes up too much room at this size
  ctx.fillText(`${Math.round(pct)}`, cx, cy + 1)
}

function drawDualDonutStyle(ctx: SKRSContext2D, sessionPct: number, weeklyPct: number): void {
  // Each donut occupies ~half the width with a clear gap in the middle
  // cx=15 and cx=51 gives 36px center-to-center; radius=12 → 12px gap between edges
  const cy = SIZE / 2
  drawDonut(ctx, 15, cy, 12, 4, sessionPct)
  drawDonut(ctx, SIZE - 15, cy, 12, 4, weeklyPct)

  // Small labels below each ring
  ctx.fillStyle = '#aaa'
  ctx.font = '9px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('S', 15, cy + 14)
  ctx.fillText('W', SIZE - 15, cy + 14)
}

function drawDualNumbersStyle(ctx: SKRSContext2D, sessionPct: number): void {
  // Just a colored dot — the actual numbers are set via tray.setTitle()
  const cx = SIZE / 2
  const cy = SIZE / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fillStyle = usageColor(sessionPct)
  ctx.fill()
}

function drawBatteryBarStyle(ctx: SKRSContext2D, pct: number): void {
  const segments = 8
  const segW = 6
  const segH = 20
  const gap = 2
  const totalW = segments * segW + (segments - 1) * gap
  const startX = (SIZE - totalW) / 2
  const startY = (SIZE - segH) / 2
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
  const canvas = createCanvas(SIZE, SIZE)
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, SIZE, SIZE)

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
