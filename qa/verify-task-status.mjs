import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto('http://127.0.0.1:5173/project/urban-heat/canvas', { waitUntil: 'domcontentloaded' })

  const finalTask = page.locator('.task-node', { hasText: 'Final edit and submission' })
  await finalTask.click()
  const statusTrigger = page.getByRole('button', { name: 'Change task status. Current status: Not Started' })
  await statusTrigger.click()

  const choices = page.locator('.task-status-option')
  const choiceLabels = await choices.allTextContents()
  if (choiceLabels.length !== 3 || choiceLabels.join('|') !== 'Not Started|In Progress|Ready for Review') {
    fail(`Expected exactly the three ordinary task states, received: ${JSON.stringify(choiceLabels)}`)
  }

  await page.getByRole('menuitemradio', { name: 'In Progress', exact: true }).click()
  if (!(await finalTask.getByText('In Progress', { exact: true }).isVisible())) {
    fail('The task node did not change to In Progress.')
  }
  const finalIncomingEdges = page.locator('.react-flow__edge[data-id="dependency-5"], .react-flow__edge[data-id="dependency-6"]')
  if (await finalIncomingEdges.count() !== 2 || await finalIncomingEdges.evaluateAll((edges) => edges.some((edge) => !edge.classList.contains('edge-flowing')))) {
    fail('The incoming task connectors did not change to moving dashed lines for In Progress.')
  }

  await page.getByRole('button', { name: 'Change task status. Current status: In Progress' }).click()
  await page.getByRole('menuitemradio', { name: 'Ready for Review', exact: true }).click()
  if (!(await finalTask.getByText('Ready for Review', { exact: true }).isVisible())) {
    fail('The task node did not change to Ready for Review.')
  }
  if (!(await page.getByRole('heading', { name: 'Cross-check' }).isVisible())) {
    fail('Cross-check did not appear for Ready for Review.')
  }

  await page.getByRole('button', { name: 'Change task status. Current status: Ready for Review' }).click()
  await page.getByRole('menuitemradio', { name: 'Not Started', exact: true }).click()
  if (!(await finalTask.getByText('Not Started', { exact: true }).isVisible())) {
    fail('The task node did not change back to Not Started.')
  }
  const returnedEdgeState = await finalIncomingEdges.evaluateAll((edges) => edges.map((edge) => {
    const path = edge.querySelector('.react-flow__edge-path')
    return { flowing: edge.classList.contains('edge-flowing'), stroke: path?.style.stroke.toLowerCase() }
  }))
  if (!returnedEdgeState.every(({ flowing, stroke }) => !flowing && ['#d9e0d7', 'rgb(217, 224, 215)'].includes(stroke))) {
    fail(`The incoming task connectors did not return to solid light-grey for Not Started: ${JSON.stringify(returnedEdgeState)}`)
  }

  await page.getByLabel('Close task details').click()
  await page.locator('.task-node', { hasText: 'Methodology and limitations' }).click()
  await page.getByRole('button', { name: 'Change task status. Current status: Completed' }).click()
  if (await page.locator('.task-status-option').count() !== 3) {
    fail('A workflow-managed task does not offer the same three ordinary workflow choices.')
  }

  await page.close()

  for (const width of [375, 768]) {
    const responsivePage = await browser.newPage({ viewport: { width, height: 900 } })
    await responsivePage.goto('http://127.0.0.1:5173/project/urban-heat/canvas', { waitUntil: 'domcontentloaded' })
    await responsivePage.locator('.task-node', { hasText: 'Final edit and submission' }).evaluate((task) => task.click())
    const panelBox = await responsivePage.locator('.task-panel').boundingBox()
    await responsivePage.getByRole('button', { name: 'Change task status. Current status: Not Started' }).click()
    const responsiveChoices = responsivePage.locator('.task-status-option')
    if (!panelBox || panelBox.x < 0 || panelBox.x + panelBox.width > width + 0.5 || await responsiveChoices.count() !== 3) {
      fail(`${width}px status panel is clipped or does not show exactly three choices: ${JSON.stringify(panelBox)}`)
    }
    await responsivePage.getByRole('menuitemradio', { name: 'In Progress', exact: true }).click()
    if (!(await responsivePage.locator('.task-panel .section-head').first().getByText('In Progress', { exact: true }).isVisible())) {
      fail(`${width}px status control did not update the selected task.`)
    }
    await responsivePage.close()
  }

  if (!process.exitCode) console.log('Task status control updates the node, connectors, conditional panel content, and responsive panel.')
} finally {
  await browser.close()
}
