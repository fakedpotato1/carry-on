import { readFile } from 'node:fs/promises'

const brandFiles = [
  'index.html',
  'README.md',
  'design-system/loadshift/MASTER.md',
  'src/components/AppShell.jsx',
  'src/components/CompileReportModal.jsx',
  'src/data/mockData.js',
  'src/pages/CreateProject.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Landing.jsx',
  'src/pages/LecturerEmail.jsx',
  'src/pages/Profile.jsx',
  'src/pages/Projects.jsx',
  'src/pages/SignUp.jsx',
]

const failures = []
for (const file of brandFiles) {
  const source = await readFile(file, 'utf8')
  if (source.includes('LoadShift')) failures.push(`${file} still contains the old product name LoadShift`)
  if (source.includes('CarryOn')) failures.push(`${file} uses CarryOn without the required space`)
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const packageLock = JSON.parse(await readFile('package-lock.json', 'utf8'))
if (packageJson.name !== 'carry-on-prototype') failures.push(`package.json name is ${packageJson.name}`)
if (packageLock.name !== 'carry-on-prototype' || packageLock.packages?.['']?.name !== 'carry-on-prototype') failures.push('package-lock.json does not use carry-on-prototype')

if (failures.length) {
  console.error(`Brand verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log('Carry On is used consistently as the product name; Load Shift remains available as the redistribution feature.')
