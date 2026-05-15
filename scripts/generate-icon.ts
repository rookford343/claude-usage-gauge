import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const ROOT = join(import.meta.dirname, '..')
const ICONSET = join(ROOT, 'resources/AppIcon.iconset')
const OUT = join(ROOT, 'resources/icon.icns')

mkdirSync(ICONSET, { recursive: true })

const sizes = [16, 32, 64, 128, 256, 512]

for (const size of sizes) {
  for (const scale of [1, 2]) {
    const px = size * scale
    const canvas = createCanvas(px, px)
    const ctx = canvas.getContext('2d')

    // Purple background circle
    ctx.beginPath()
    ctx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2)
    ctx.fillStyle = '#7C3AED'
    ctx.fill()

    // Donut ring: faint track
    const r = px * 0.32
    const lw = px * 0.16
    ctx.beginPath()
    ctx.arc(px / 2, px / 2, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = lw
    ctx.stroke()

    // Donut arc: ~70% filled (represents usage gauge)
    ctx.beginPath()
    ctx.arc(px / 2, px / 2, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.4)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = lw
    ctx.stroke()

    const suffix = scale === 2 ? '@2x' : ''
    const filename = `icon_${size}x${size}${suffix}.png`
    writeFileSync(join(ICONSET, filename), canvas.toBuffer('image/png'))
    console.log(`  wrote ${filename} (${px}×${px})`)
  }
}

execSync(`iconutil -c icns "${ICONSET}" -o "${OUT}"`)
rmSync(ICONSET, { recursive: true })
console.log(`✓ resources/icon.icns generated`)
