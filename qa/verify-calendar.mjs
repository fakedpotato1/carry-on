import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})

try {
  for (const width of [1440, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto('http://127.0.0.1:5173/calendar', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Your upcoming tasks' }).waitFor()

    const focusCards = await page.getByRole('heading', { name: 'Focus this week' }).count()
    const upcomingVisible = await page.getByRole('heading', { name: 'Upcoming Tasks', exact: true }).isVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

    if (focusCards !== 0 || !upcomingVisible || overflow > 1) {
      console.error(`${width}px Calendar check failed: ${JSON.stringify({ focusCards, upcomingVisible, overflow })}`)
      process.exitCode = 1
    } else {
      console.log(`${width}px Calendar keeps Upcoming Tasks, removes Focus this week, and has no page overflow.`)
    }

    if (width === 1440) {
      await page.getByRole('button', { name: 'Add Task', exact: true }).click()
      const typeSelect = page.getByLabel('Type')
      const typeOptions = await typeSelect.locator('option').allTextContents()
      if (typeOptions.join('|') !== 'Meeting|Milestone|Other' || await typeSelect.inputValue() !== 'Meeting') {
        console.error(`Calendar Add Task exposes unexpected types: ${JSON.stringify(typeOptions)}`)
        process.exitCode = 1
      }

      const calendarOnlyTitle = 'Calendar-only QA meeting'
      await page.getByLabel('Title').fill(calendarOnlyTitle)
      await page.locator('button[type="submit"][form="add-task-form"]').click()
      if (!(await page.locator('.calendar-task-label').getByText(calendarOnlyTitle, { exact: true }).isVisible())) {
        console.error('The Calendar entry did not appear after Add Task submission.')
        process.exitCode = 1
      }

      await page.goto('http://127.0.0.1:5173/project/urban-heat/canvas', { waitUntil: 'domcontentloaded' })
      await page.locator('.react-flow').waitFor()
      if (await page.locator('.task-node', { hasText: calendarOnlyTitle }).count() !== 0) {
        console.error('A Calendar-only entry was incorrectly added to the Project Mindmap.')
        process.exitCode = 1
      } else {
        console.log('Add Task offers Meeting, Milestone, and Other only; its entry stays out of the Project Mindmap.')
      }
    }
    await page.close()
  }
} finally {
  await browser.close()
}
