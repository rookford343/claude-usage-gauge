import { nativeImage, type NativeImage } from 'electron'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import type { DisplayStyle } from './types'

const SIZE = 44 // @2x for Retina — renders at 22pt

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
  ctx.strokeStyle = '#444'
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
  const radius = SIZE / 2 - 6
  drawDonut(ctx, cx, cy, radius, 5, pct)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${Math.round(pct)}%`, cx, cy)
}

function drawDualDonutStyle(ctx: SKRSContext2D, sessionPct: number, weeklyPct: number): void {
  drawDonut(ctx, 12, SIZE / 2, 9, 3, sessionPct)
  drawDonut(ctx, SIZE - 12, SIZE / 2, 9, 3, weeklyPct)
}

function drawDualNumbersStyle(ctx: SKRSContext2D, sessionPct: number): void {
  const cx = SIZE / 2
  const cy = SIZE / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fillStyle = usageColor(sessionPct)
  ctx.fill()
}

function drawBatteryBarStyle(ctx: SKRSContext2D, pct: number): void {
  const segments = 8
  const segW = 4
  const segH = 14
  const gap = 1
  const totalW = segments * segW + (segments - 1) * gap
  const startX = (SIZE - totalW) / 2
  const startY = (SIZE - segH) / 2
  const filled = Math.round((pct / 100) * segments)

  for (let i = 0; i < segments; i++) {
    const x = startX + i * (segW + gap)
    ctx.fillStyle = i < filled ? usageColor(pct) : '#444'
    ctx.beginPath()
    ctx.roundRect(x, startY, segW, segH, 1)
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
  return nativeImage.createFromBuffer(buf, { scaleFactor: 2 })
}
