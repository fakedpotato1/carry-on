import { chromium } from 'playwright-core'

const expectedSources = ['/img/pdf.png', '/img/excel.png', '/img/docx.png']
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('http://127.0.0.1:5173/project/urban-heat/canvas', { waitUntil: 'networkidle' })
  const images = await page.locator('.canvas-doc-list img').evaluateAll((elements) => elements.map((image) => ({
    source: new URL(image.src).pathname,
    loaded: image.complete && image.naturalWidth > 0,
  })))
  const missing = expectedSources.filter((source) => !images.some((image) => image.source === source && image.loaded))
  if (missing.length) {
    console.error(`Missing rendered document images: ${missing.join(', ')}`)
    process.exitCode = 1
  } else {
    console.log(`Rendered document images: ${expectedSources.join(', ')}`)
  }

  await page.goto('http://127.0.0.1:5173/project/campus-mobility/canvas', { waitUntil: 'networkidle' })
  const fallbackSize = await page.locator('.canvas-doc-list .doc-chip-fallback').first().evaluate((chip) => {
    const icon = chip.querySelector('svg')
    const chipBox = chip.getBoundingClientRect()
    const iconBox = icon.getBoundingClientRect()
    return {
      chip: [chipBox.width, chipBox.height],
      icon: [iconBox.width, iconBox.height],
      centerOffset: [
        (iconBox.left + iconBox.width / 2) - (chipBox.left + chipBox.width / 2),
        (iconBox.top + iconBox.height / 2) - (chipBox.top + chipBox.height / 2),
      ],
    }
  })
  if (fallbackSize.chip.some((value) => value !== 32) || fallbackSize.icon.some((value) => value !== 24) || fallbackSize.centerOffset.some((value) => Math.abs(value) > 0.5)) {
    console.error(`Fallback icon sizing mismatch: ${JSON.stringify(fallbackSize)}`)
    process.exitCode = 1
  } else {
    console.log('Drive/GitHub fallback icons: centered 24px icons within 32px rounded chips')
  }
} finally {
  await browser.close()
}
