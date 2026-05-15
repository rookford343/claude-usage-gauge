import { nativeImage, type NativeImage } from 'electron'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import type { DisplayStyle } from './types'

// Wide canvas (132×66 @3x) for dual-donut and battery-bar styles
// Square canvas (66×66 @3x) for donut and dual-numbers — text shown via tray.setTitle()
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


function drawDonutStyle(ctx: SKRSContext2D, pct: number): void {
  // Square canvas (H×H) — text is shown via tray.setTitle(), not drawn here
  const cx = H / 2
  const cy = H / 2
  const radius = H / 2 - 7
  drawDonut(ctx, cx, cy, radius, 12, pct)
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
): NativeImage {
  // Donut and dual-numbers use a square canvas — text is rendered via tray.setTitle()
  // Dual-donut and battery-bar need the full wide canvas for their layout
  const canvasW = style === 'dual-donut' || style === 'battery-bar' ? W : H
  const canvas = createCanvas(canvasW, H)
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvasW, H)

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
