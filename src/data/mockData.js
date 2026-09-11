export const currentUser = { name: 'Ethan', role: 'Student' }

export const team = [
  { id: 1, name: 'Aisha Rahman', initials: 'AR', role: 'Team lead', workload: 72, confirmed: true, photo: '/img/girl-profile.jpg' },
  { id: 2, name: 'Ben Lim', initials: 'BL', role: 'Research', workload: 48, confirmed: true, photo: '/img/boy-profile.jpg' },
  { id: 3, name: 'Clara Wong', initials: 'CW', role: 'Data analysis', workload: 64, confirmed: true, photo: '/img/girl-profile.jpg' },
  { id: 4, name: 'Daniel Tan', initials: 'DT', role: 'Discussion draft', workload: 26, confirmed: false, photo: '/img/boy-profile.jpg' },
]

export const project = {
  id: 'urban-heat', title: 'Urban Heat & Student Wellbeing', module: 'ENV2104 · Research Methods', type: 'Report',
  deadline: '18 Sep 2026, 11:59 PM', daysLeft: 12, progress: 68, atRisk: false,
  document: 'Urban Heat Group Report — Working Draft', repository: 'carry-on-team/urban-heat-analysis',
  description: 'Investigating the impact of urban heat on student wellbeing and proposing data-driven solutions for a healthier campus environment.',
  coverImage: '/covers/urban-heat.jpg',
  startDate: '1 Sep 2026',
  tags: ['Urban heat', 'Student wellbeing', 'Data analysis', 'Campus environment'],
  documents: [
    { type: 'pdf', name: 'Literature Review Draft.pdf', author: 'Aisha Rahman', date: '2 Oct 2026'},
    { type: 'sheet', name: 'Dataset_Collection.xlsx', author: 'Ben Lim', date: '1 Oct 2026' },
    { type: 'doc', name: 'Survey_Questions.docx', author: 'Clara Wong', date: '28 Sep 2026' },
    { type: 'pdf', name: 'Project_Proposal.pdf', author: 'Ethan Tan', date: '25 Sep 2026' },
  ],
}

export const projects = [
  project,
  {
    id: 'campus-mobility', title: 'Campus Mobility API', module: 'SWE2202 · Software Studio', type: 'Coding', deadline: '28 Sep 2026, 11:59 PM', progress: 34, daysLeft: 21, atRisk: true,
    description: 'Developing an API prototype to improve campus mobility through real-time data and route optimization.',
    coverImage: '/covers/campus-mobility.jpg',
    startDate: '3 Sep 2026',
    tags: ['Campus mobility', 'API design', 'Real-time data', 'Route optimization'],
    documents: [
      { type: 'pdf', name: 'API_Spec.pdf', author: 'Ben Lim', date: '4 Sep 2026' },
      { type: 'doc', name: 'Design_Notes.docx', author: 'Aisha Rahman', date: '8 Sep 2026' },
      { type: 'code', name: 'GitHub Repo', author: 'Clara Wong', date: '9 Sep 2026' },
    ],
  },
]

export const dashboardOverview = { totalProjectSlots: 5, dueThisWeek: 1 }

export const upcoming = [
  { date: '2 Oct 2026', title: 'Literature Review Draft', projectId: 'urban-heat' },
  { date: '12 Oct 2026', title: 'API Testing & Debugging', projectId: 'campus-mobility' },
  { date: '20 Oct 2026', title: 'Final Report Submission', projectId: 'urban-heat' },
]

export const taskTypes = ['Assignment', 'Meeting', 'Milestone', 'Other']

export const calendarTasks = [
  { id: 'cal-1', date: '2026-09-08', title: 'Discussion Outline Checkpoint', projectId: 'urban-heat', type: 'Milestone' },
  { id: 'cal-2', date: '2026-09-11', title: 'Methodology Review', projectId: 'urban-heat', type: 'Meeting' },
  { id: 'cal-3', date: '2026-09-13', title: 'Wellbeing Survey Summary', projectId: 'urban-heat', type: 'Assignment' },
  { id: 'cal-4', date: '2026-09-18', title: 'Report Submission', projectId: 'urban-heat', type: 'Assignment' },
  { id: 'cal-5', date: '2026-09-21', title: 'Sprint Planning', projectId: 'campus-mobility', type: 'Meeting' },
  { id: 'cal-6', date: '2026-09-25', title: 'API Endpoint Review', projectId: 'campus-mobility', type: 'Milestone' },
  { id: 'cal-7', date: '2026-09-28', title: 'Campus Mobility Submission', projectId: 'campus-mobility', type: 'Assignment' },
  { id: 'cal-8', date: '2026-10-02', title: 'Literature Review Draft', projectId: 'urban-heat', type: 'Assignment' },
  { id: 'cal-9', date: '2026-10-06', title: 'Team Sync', projectId: 'campus-mobility', type: 'Meeting' },
  { id: 'cal-10', date: '2026-10-08', title: 'API Testing & Debugging', projectId: 'campus-mobility', type: 'Milestone' },
  { id: 'cal-11', date: '2026-10-12', title: 'Progress Report Submission', projectId: 'urban-heat', type: 'Assignment' },
  { id: 'cal-12', date: '2026-10-20', title: 'Final Report Submission', projectId: 'urban-heat', type: 'Assignment' },
]

export const briefText = `Prepare a 3,500-word evidence-based report examining how urban heat affects university student wellbeing. Compare two campus zones, analyse primary temperature data, and propose three practical interventions. Include an executive summary, methodology, findings, discussion, recommendations, and Harvard-style references.`

export const rubric = [
  { criterion: 'Evidence and literature', weight: 25, estimate: 78, note: 'Strong coverage; add one regional source.' },
  { criterion: 'Methodology', weight: 20, estimate: 72, note: 'Sampling limitations need clearer justification.' },
  { criterion: 'Analysis and findings', weight: 25, estimate: 76, note: 'Charts support the comparison well.' },
  { criterion: 'Discussion and recommendations', weight: 20, estimate: 64, note: 'One required intervention is not yet developed.' },
  { criterion: 'Structure and referencing', weight: 10, estimate: 82, note: 'Consistent structure and citation format.' },
]

export const initialTasks = [
  { id: 'research', title: 'Literature review', owner: 'Ben Lim', deadline: '10 Sep', deliverable: '900-word synthesis and source table', weight: 15, status: 'Ready for Review' },
  { id: 'methods', title: 'Methodology and limitations', owner: 'Aisha Rahman', deadline: '12 Sep', deliverable: '650-word methods section with limitations', weight: 12, status: 'Completed' },
  { id: 'analysis', title: 'Temperature data analysis', owner: 'Clara Wong', deadline: '11 Sep', deliverable: 'Clean dataset and three comparison charts', weight: 18, status: 'In Progress' },
  { id: 'survey', title: 'Student wellbeing survey summary', owner: 'Ben Lim', deadline: '13 Sep', deliverable: 'Theme summary with anonymised quotes', weight: 10, status: 'Due Soon' },
  { id: 'discussion', title: 'Discussion and interventions', owner: 'Daniel Tan', deadline: '12 Sep', deliverable: '800-word discussion and three interventions', weight: 18, status: 'Potential Risk' },
  { id: 'recommendations', title: 'Feasibility check', owner: 'Clara Wong', deadline: '14 Sep', deliverable: 'Cost and feasibility notes for each intervention', weight: 10, status: 'Blocked' },
  { id: 'references', title: 'Reference and figure audit', owner: 'Aisha Rahman', deadline: '15 Sep', deliverable: 'Verified citations, captions, and appendix links', weight: 7, status: 'Rebalanced', originalOwner: 'Daniel Tan' },
  { id: 'final', title: 'Final edit and submission', owner: 'Aisha Rahman', deadline: '16 Sep', deliverable: 'Integrated submission-ready report', weight: 10, status: 'Not Started' },
]

export const taskDependencies = [
  ['research', 'discussion'], ['methods', 'analysis'], ['analysis', 'discussion'], ['survey', 'discussion'],
  ['discussion', 'recommendations'], ['recommendations', 'final'], ['references', 'final'],
]

export const activity = [
  { time: 'Today, 10:42 AM', actor: 'Clara', detail: 'Added campus-zone comparison chart to the shared document.', source: 'Google Docs' },
  { time: 'Today, 9:15 AM', actor: 'Aisha', detail: 'Resolved two methodology comments and updated the sampling note.', source: 'Google Docs' },
  { time: 'Yesterday, 6:30 PM', actor: 'Carry On', detail: 'Recorded the second unanswered task reminder for “Discussion and interventions”.', source: 'Reminder log' },
  { time: '4 Sep, 3:08 PM', actor: 'Ben', detail: 'Marked the literature synthesis ready for team review.', source: 'Team update' },
]

export const riskEvidence = [
  { date: '2 Sep, 4:00 PM', title: 'Plan confirmed', detail: 'Daniel confirmed responsibility for the discussion and three intervention proposals.' },
  { date: '8 Sep, 5:00 PM', title: 'Checkpoint missed', detail: 'The agreed outline checkpoint passed without a draft or status update.' },
  { date: '8 Sep, 5:10 PM', title: 'First reminder', detail: 'Aisha sent a supportive reminder and offered help with the evidence synthesis.' },
  { date: '9 Sep, 7:30 PM', title: 'No response recorded', detail: 'No reply or document activity was visible after 24 hours.' },
  { date: '10 Sep, 6:30 PM', title: 'Second reminder', detail: 'The team asked whether scope or timing should be adjusted. No response yet.' },
]

export const evidenceTimeline = [
  { date: '2 Sep', title: 'Responsibilities agreed', detail: 'All four members reviewed the task plan. Daniel accepted discussion and interventions (18%).', tone: 'confirmed' },
  { date: '6 Sep', title: 'Early research activity', detail: 'Ben added 11 sources; Clara uploaded the cleaned temperature dataset.', tone: 'neutral' },
  { date: '8 Sep', title: 'Outline checkpoint missed', detail: 'No discussion outline or status update was recorded by the agreed checkpoint.', tone: 'due' },
  { date: '8–10 Sep', title: 'Two recovery attempts', detail: 'The team sent two reminders, offered help, and proposed a smaller first deliverable.', tone: 'attention' },
  { date: '11 Sep', title: 'Load Shift proposed', detail: 'A recovery plan split the urgent section. Original ownership remained recorded.', tone: 'rebalanced' },
  { date: '12 Sep', title: 'Revised plan confirmed', detail: 'The team approved the change. Daniel remains invited to review the final section.', tone: 'confirmed' },
]
