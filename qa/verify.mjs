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
const shellRoutes = routes.filter((route) => !['/', '/signup'].includes(route))

const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true })
const errors = []
const results = []
const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
desktop.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
desktop.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })

for (const route of routes) {
  const response = await desktop.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  const firstHeading = desktop.locator('h1, h2').first()
  results.push({
    route,
    status: response,
    httpStatus: response?.status(),
    heading: (await firstHeading.textContent())?.trim(),
    overflow: await desktop.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    sidebarLinks: await desktop.locator('aside.side-nav nav a').count(),
  })
}

await desktop.goto(`${base}/project/new`, { waitUntil: 'networkidle' })
await desktop.getByRole('button', { name: 'Coding' }).click()
if (!(await desktop.getByRole('button', { name: 'Connect repository' }).isVisible())) errors.push('Coding type did not show GitHub connection')
await desktop.getByRole('button', { name: 'Report' }).click()
if (!(await desktop.getByRole('button', { name: 'Connect document' }).isVisible())) errors.push('Report type did not show Google Docs connection')
await desktop.getByLabel('Project title').fill('Urban Heat')
await desktop.getByRole('button', { name: 'Analyze and create draft' }).click()
await desktop.waitForURL('**/project/*/canvas', { timeout: 6000 })
try { await desktop.getByText('Draft plan', { exact: true }).waitFor({ state: 'visible', timeout: 3000 }) } catch { errors.push('Create Project did not open Draft canvas') }
await desktop.screenshot({ path: 'qa/canvas-draft-desktop.png', fullPage: true })
await desktop.getByRole('button', { name: 'Confirm Plan' }).click()
await desktop.getByRole('button', { name: 'Confirm and activate' }).click()
try { await desktop.getByText('Active project', { exact: true }).waitFor({ state: 'visible', timeout: 3000 }) } catch { errors.push('Confirm Plan did not activate the canvas') }

await desktop.goto(`${base}/project/urban-heat/canvas?qa=active`, { waitUntil: 'networkidle' })
await desktop.locator('.task-node').first().waitFor({ state: 'visible' })
const requiredStates = ['Not Started', 'In Progress', 'Completed', 'Due Soon', 'Blocked', 'Potential Risk', 'Rebalanced']
for (const state of requiredStates) {
  if (await desktop.locator('.task-node').filter({ hasText: state }).count() === 0) errors.push(`Active canvas missing ${state} node`)
}
await desktop.screenshot({ path: 'qa/canvas-active-desktop.png', fullPage: true })
const flowingEdge = desktop.locator('.edge-flowing').first()
if (await flowingEdge.count() === 0) {
  errors.push('Active canvas has no flowing in-progress edge')
} else {
  const normalAnimation = await flowingEdge.evaluate((element) => getComputedStyle(element.querySelector('.react-flow__edge-path')).animationName)
  if (normalAnimation !== 'dash-flow') errors.push(`In-progress edge animation was ${normalAnimation}`)
  await desktop.emulateMedia({ reducedMotion: 'reduce' })
  const reducedAnimation = await flowingEdge.evaluate((element) => getComputedStyle(element.querySelector('.react-flow__edge-path')).animationName)
  if (reducedAnimation !== 'none') errors.push(`Reduced motion edge animation remained ${reducedAnimation}`)
  await desktop.emulateMedia({ reducedMotion: 'no-preference' })
}

await desktop.locator('.task-node').filter({ hasText: 'Discussion and interventions' }).click()
if (!(await desktop.getByText('This is not a final judgment.', { exact: true }).isVisible())) errors.push('Risk panel is missing non-judgment statement')
await desktop.getByRole('button', { name: 'Ask AI to plan a task swap' }).click()
const shiftPanel = desktop.locator('.load-shift-inline')
try { await desktop.locator('.toast').waitFor({ state: 'hidden', timeout: 5000 }) } catch { errors.push('AI task-swap notification did not dismiss automatically') }
if (await shiftPanel.locator('select').count()) errors.push('AI redistribution still exposes a manual recipient selector')
if (!(await shiftPanel.getByText("Ben Lim's decision", { exact: true }).isVisible())) errors.push('AI redistribution did not choose Ben first')
if (!(await shiftPanel.getByText('Appendix formatting', { exact: true }).isVisible())) errors.push('AI redistribution did not pair a standalone task')
await desktop.getByRole('button', { name: 'Reject', exact: true }).click()
if (!(await shiftPanel.getByText("Clara Wong's decision", { exact: true }).isVisible())) errors.push('Rejection did not advance to the next AI-selected recipient')
if (!(await shiftPanel.getByText(/Earlier proposal declined:.*Ben Lim/).isVisible())) errors.push('Rejected recipient was not preserved in proposal history')
if (!(await desktop.locator('.task-node').filter({ hasText: 'Discussion and interventions' }).getByText('Daniel Tan', { exact: true }).isVisible())) errors.push('Reject changed the critical task owner')
await desktop.getByRole('button', { name: 'Accept task swap' }).click()
await desktop.getByRole('button', { name: 'Confirm and rebalance' }).click()
if (!(await desktop.locator('.task-panel').getByText('Task swap accepted', { exact: true }).isVisible())) errors.push('Accepted AI task swap did not show its persistent confirmed state')
if (!(await desktop.locator('.task-node').filter({ hasText: 'Discussion and interventions' }).getByText('Clara Wong', { exact: true }).isVisible())) errors.push('Accepted swap did not update the critical task owner')
if (!(await desktop.locator('.task-node').filter({ hasText: 'Discussion and interventions' }).getByText('Originally Daniel Tan', { exact: true }).isVisible())) errors.push('Accepted swap did not preserve the critical task original owner')
if (!(await desktop.locator('.task-node').filter({ hasText: 'Figure notes and alt text' }).getByText('Daniel Tan', { exact: true }).isVisible())) errors.push('Accepted swap did not update the standalone task owner')
if (!(await desktop.locator('.task-node').filter({ hasText: 'Figure notes and alt text' }).getByText('Originally Clara Wong', { exact: true }).isVisible())) errors.push('Accepted swap did not preserve the standalone task original owner')

await desktop.getByRole('button', { name: 'Close task details' }).click()
await desktop.locator('.task-node').filter({ hasText: 'Literature review' }).click()
await desktop.getByRole('button', { name: 'Ask AI to cross-check' }).click()
if (!(await desktop.getByText('Possible evidence gap', { exact: true }).isVisible())) errors.push('Cross-check advisory did not render')

await desktop.goto(`${base}/project/urban-heat/canvas?qa=exhausted`, { waitUntil: 'networkidle' })
await desktop.locator('.task-node').filter({ hasText: 'Discussion and interventions' }).click()
await desktop.getByRole('button', { name: 'Ask AI to plan a task swap' }).click()
await desktop.getByRole('button', { name: 'Reject', exact: true }).click()
await desktop.getByRole('button', { name: 'Reject', exact: true }).click()
if (!(await desktop.getByText('Lecturer review needed', { exact: true }).isVisible())) errors.push('Exhausted recipient list did not stop at lecturer review')
if (!(await desktop.locator('.task-panel').getByRole('link', { name: 'Draft Lecturer Email' }).isVisible())) errors.push('Exhausted recipient list did not offer the lecturer email route')
if (!(await desktop.locator('.task-node').filter({ hasText: 'Discussion and interventions' }).getByText('Daniel Tan', { exact: true }).isVisible())) errors.push('Exhausted recipient list forced a task owner change')

const mobile = await browser.newPage({ viewport: { width: 375, height: 900 }, isMobile: true })
await mobile.goto(`${base}/project/urban-heat/canvas`, { waitUntil: 'networkidle' })
const mobileMetrics = await mobile.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > window.innerWidth }))
await mobile.screenshot({ path: 'qa/canvas-active-mobile.png', fullPage: true })
await mobile.getByRole('button', { name: 'Open navigation menu' }).click()
const mobileMenuLinks = await mobile.locator('#mobile-primary-menu a').count()
if (mobileMenuLinks !== 4) errors.push(`Mobile navigation has ${mobileMenuLinks} links instead of 4`)

const responsive = []
for (const width of [768, 1024]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto(`${base}/project/urban-heat/canvas?viewport=${width}`, { waitUntil: 'networkidle' })
  const metrics = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > window.innerWidth }))
  responsive.push(metrics)
  if (metrics.overflow) errors.push(`${width}px canvas has horizontal page overflow`)
  await page.close()
}

console.log(JSON.stringify({ routes: results.map(({ status, ...result }) => result), mobile: mobileMetrics, mobileMenuLinks, responsive, errors }, null, 2))
await browser.close()

if (errors.length || results.some((result) => result.httpStatus !== 200 || result.overflow || result.sidebarLinks !== (shellRoutes.includes(result.route) ? 3 : 0)) || mobileMetrics.overflow) process.exit(1)
