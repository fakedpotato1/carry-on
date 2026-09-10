import { chromium } from 'playwright-core'

const base = 'http://127.0.0.1:5173'
const routes = [
  '/',
  '/signup',
  '/dashboard',
  '/projects',
  '/calendar',
  '/profile',
  '/project/new',
  '/project/urban-heat/canvas',
  '/project/urban-heat/evidence',
  '/project/urban-heat/lecturer-email',
  '/project/urban-heat/rubric-evaluation',
]
const widths = [375, 768, 1024, 1440]
const shellRoutes = routes.filter((route) => !['/', '/signup'].includes(route))

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})
const failures = []

try {
  for (const width of widths) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width === 375 })
      const runtimeErrors = []
      page.on('pageerror', (error) => runtimeErrors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })

      const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
      await page.locator('body').waitFor()
      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }))

      if (response?.status() !== 200) failures.push(`${width}px ${route}: HTTP ${response?.status()}`)
      if (metrics.scrollWidth > metrics.innerWidth + 1 || metrics.bodyScrollWidth > metrics.innerWidth + 1) {
        failures.push(`${width}px ${route}: horizontal overflow ${JSON.stringify(metrics)}`)
      }
      if (runtimeErrors.length) failures.push(`${width}px ${route}: ${runtimeErrors.join(' | ')}`)

      if (width <= 768 && shellRoutes.includes(route)) {
        const mobileBarVisible = await page.locator('.mobile-bar').isVisible()
        const desktopSidebarVisible = await page.locator('.side-nav').isVisible()
        if (!mobileBarVisible || desktopSidebarVisible) {
          failures.push(`${width}px ${route}: mobile navigation state is incorrect`)
        }
      }

      if (width >= 1024 && shellRoutes.includes(route)) {
        const mobileBarVisible = await page.locator('.mobile-bar').isVisible()
        const desktopSidebarVisible = await page.locator('.side-nav').isVisible()
        if (mobileBarVisible || !desktopSidebarVisible) {
          failures.push(`${width}px ${route}: desktop navigation state is incorrect`)
        }
      }

      if (width <= 768 && route === '/dashboard') {
        await page.getByRole('button', { name: 'Open navigation menu' }).click()
        if (!(await page.locator('#mobile-primary-menu').isVisible())) failures.push(`${width}px: mobile menu did not open`)
        await page.keyboard.press('Escape')
        if (await page.locator('#mobile-primary-menu').count()) failures.push(`${width}px: Escape did not close the mobile menu`)
      }

      if (width <= 768 && route === '/calendar') {
        const boardMetrics = await page.locator('.calendar-board-scroll').evaluate((board) => {
          const firstCell = board.querySelector('.calendar-cell')?.getBoundingClientRect()
          return { clientWidth: board.clientWidth, scrollWidth: board.scrollWidth, cellWidth: firstCell?.width ?? 0 }
        })
        if ((width === 375 && boardMetrics.scrollWidth <= boardMetrics.clientWidth) || boardMetrics.cellWidth < 44) {
          failures.push(`${width}px /calendar: calendar board is not touch-friendly ${JSON.stringify(boardMetrics)}`)
        }
        await page.getByRole('button', { name: 'Add Task', exact: true }).click()
        const modalBox = await page.locator('.modal-panel').boundingBox()
        if (!modalBox || modalBox.x < 0 || modalBox.x + modalBox.width > width + 1 || modalBox.y < 0 || modalBox.y + modalBox.height > 900 + 1) {
          failures.push(`${width}px /calendar: Add Task dialog is outside the viewport ${JSON.stringify(modalBox)}`)
        }
        await page.getByRole('button', { name: 'Close dialog' }).click()
      }

      if (width <= 768 && route === '/project/urban-heat/canvas') {
        if (await page.locator('.canvas-legend.open').count()) failures.push(`${width}px /canvas: task legend should start collapsed`)
        if (!(await page.locator('.canvas-cover-change').isVisible())) failures.push(`${width}px /canvas: cover-image action is hidden`)
      }

      console.log(`${width}px ${route} ${metrics.scrollWidth <= metrics.innerWidth + 1 ? 'fits' : 'overflows'}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(`\nResponsive failures:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log('\nAll routes fit at 375px, 768px, 1024px, and 1440px.')
