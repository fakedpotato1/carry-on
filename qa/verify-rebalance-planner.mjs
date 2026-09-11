import assert from 'node:assert/strict'
import { initialTasks, taskDependencies, team } from '../src/data/mockData.js'
import { createAiRebalancePlan, currentRebalanceCandidate, rejectRebalanceCandidate } from '../src/lib/rebalancePlanner.js'

const originalTasks = structuredClone(initialTasks)
const plan = createAiRebalancePlan({
  riskTaskId: 'discussion',
  tasks: initialTasks,
  dependencies: taskDependencies,
  members: team,
})

assert.equal(plan.criticalTaskId, 'discussion')
assert.deepEqual(plan.blockedTaskIds.sort(), ['final', 'recommendations'])
assert.equal(plan.status, 'pending')
assert.equal(currentRebalanceCandidate(plan).recipient, 'Ben Lim')
assert.equal(currentRebalanceCandidate(plan).reliefTaskId, 'appendix')
assert.equal(currentRebalanceCandidate(plan).recipientWorkloadAfter, 61)

const afterFirstRejection = rejectRebalanceCandidate(plan)
assert.equal(afterFirstRejection.status, 'pending')
assert.deepEqual(afterFirstRejection.rejectedBy, ['Ben Lim'])
assert.equal(currentRebalanceCandidate(afterFirstRejection).recipient, 'Clara Wong')
assert.equal(currentRebalanceCandidate(afterFirstRejection).reliefTaskId, 'figure-notes')

const afterSecondRejection = rejectRebalanceCandidate(afterFirstRejection)
assert.equal(afterSecondRejection.status, 'exhausted')
assert.deepEqual(afterSecondRejection.rejectedBy, ['Ben Lim', 'Clara Wong'])
assert.equal(currentRebalanceCandidate(afterSecondRejection), null)
assert.deepEqual(initialTasks, originalTasks, 'planning and rejection must not mutate task ownership')

console.log('AI redistribution planner selects a safe paired swap, advances after rejection, and stops without forcing ownership.')
