import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})

try {
  for (const width of [1440, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto('http://127.0.0.1:5173/project/urban-heat/canvas', { waitUntil: 'networkidle' })
    const geometry = await page.locator('.canvas-hero-dates .canvas-date-icon').evaluateAll((icons) => icons.map((icon) => {
      const box = icon.getBoundingClientRect()
      return { top: box.top, centerY: box.top + box.height / 2, width: box.width, height: box.height }
    }))
    const topSpread = Math.max(...geometry.map((item) => item.top)) - Math.min(...geometry.map((item) => item.top))
    if (geometry.length !== 3 || topSpread > 0.5) {
      console.error(`${width}px date icon alignment mismatch: ${JSON.stringify({ topSpread, geometry })}`)
      process.exitCode = 1
    } else {
      console.log(`${width}px date icons aligned: ${JSON.stringify(geometry)}`)
    }
    await page.close()
  }
} finally {
  await browser.close()
}
