const RELIEF_ELIGIBLE_STATUSES = new Set(['Not Started', 'In Progress', 'Due Soon'])
const MAX_SAFE_WORKLOAD = 85

function downstreamTaskIds(taskId, dependencies) {
  const visited = new Set()
  const queue = [taskId]

  while (queue.length) {
    const source = queue.shift()
    dependencies
      .filter(([dependencySource]) => dependencySource === source)
      .forEach(([, target]) => {
        if (!visited.has(target)) {
          visited.add(target)
          queue.push(target)
        }
      })
  }

  return [...visited]
}

function isStandaloneTask(taskId, dependencies) {
  return !dependencies.some(([source, target]) => source === taskId || target === taskId)
}

function selectCriticalTask(riskOwner, tasks, dependencies) {
  return tasks
    .filter((task) => task.owner === riskOwner && task.status !== 'Completed')
    .map((task) => ({ task, blockedTaskIds: downstreamTaskIds(task.id, dependencies) }))
    .sort((left, right) => (
      right.blockedTaskIds.length - left.blockedTaskIds.length
      || right.task.weight - left.task.weight
      || left.task.deadline.localeCompare(right.task.deadline)
    ))[0]
}

function matchingSkills(member, task) {
  const taskSkills = task.skills || []
  const memberSkills = new Set(member.skills || [])
  return taskSkills.filter((skill) => memberSkills.has(skill))
}

export function createAiRebalancePlan({ riskTaskId, tasks, dependencies, members }) {
  const riskTask = tasks.find((task) => task.id === riskTaskId)
  if (!riskTask || riskTask.status !== 'Potential Risk') return null

  const criticalSelection = selectCriticalTask(riskTask.owner, tasks, dependencies)
  if (!criticalSelection) return null

  const { task: criticalTask, blockedTaskIds } = criticalSelection
  const riskMember = members.find((member) => member.name === riskTask.owner)

  const candidates = members
    .filter((member) => member.name !== riskTask.owner)
    .map((member) => {
      const reliefTask = tasks
        .filter((task) => task.owner === member.name)
        .filter((task) => RELIEF_ELIGIBLE_STATUSES.has(task.status))
        .filter((task) => isStandaloneTask(task.id, dependencies))
        .sort((left, right) => left.weight - right.weight || left.deadline.localeCompare(right.deadline))[0]

      if (!reliefTask) return null

      const workloadBefore = member.workload
      const workloadAfter = workloadBefore - reliefTask.weight + criticalTask.weight
      if (workloadAfter > MAX_SAFE_WORKLOAD) return null

      const skillMatches = matchingSkills(member, criticalTask)

      return {
        recipient: member.name,
        recipientRole: member.role,
        skillMatches,
        fitScore: skillMatches.length,
        reliefTaskId: reliefTask.id,
        reliefTaskTitle: reliefTask.title,
        reliefTaskWeight: reliefTask.weight,
        recipientWorkloadBefore: workloadBefore,
        recipientWorkloadAfter: workloadAfter,
        riskOwnerWorkloadBefore: riskMember?.workload ?? criticalTask.weight,
        riskOwnerWorkloadAfter: Math.max(0, (riskMember?.workload ?? criticalTask.weight) - criticalTask.weight + reliefTask.weight),
      }
    })
    .filter(Boolean)
    .sort((left, right) => (
      right.fitScore - left.fitScore
      || left.recipientWorkloadAfter - right.recipientWorkloadAfter
      || left.reliefTaskWeight - right.reliefTaskWeight
      || left.recipient.localeCompare(right.recipient)
    ))

  return {
    riskTaskId,
    riskOwner: riskTask.owner,
    criticalTaskId: criticalTask.id,
    criticalTaskTitle: criticalTask.title,
    criticalTaskWeight: criticalTask.weight,
    blockedTaskIds,
    blockedTaskTitles: blockedTaskIds.map((taskId) => tasks.find((task) => task.id === taskId)?.title).filter(Boolean),
    candidates,
    candidateIndex: 0,
    rejectedBy: [],
    status: candidates.length ? 'pending' : 'exhausted',
  }
}

export function currentRebalanceCandidate(plan) {
  return plan?.candidates?.[plan.candidateIndex] || null
}

export function rejectRebalanceCandidate(plan) {
  const candidate = currentRebalanceCandidate(plan)
  if (!plan || !candidate) return plan

  const candidateIndex = plan.candidateIndex + 1
  return {
    ...plan,
    candidateIndex,
    rejectedBy: [...plan.rejectedBy, candidate.recipient],
    status: candidateIndex < plan.candidates.length ? 'pending' : 'exhausted',
  }
}
