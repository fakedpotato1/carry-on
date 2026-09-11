# Carry On AI Redistribution Design Philosophy

> This document defines how Carry On proposes and confirms task redistribution inside the Project Canvas. It inherits every visual, accessibility, language, AI-advisory, and human-control rule in [`MASTER.md`](./MASTER.md).

## Purpose

AI redistribution exists to protect a project from dependency blockage without shaming a student or silently transferring their work to someone else. It is a temporary recovery mechanism while the team can seek context or lecturer support.

The feature does not decide whether a person is a free rider. It starts from an existing **Potential Contribution Risk** state supported by repeated factual evidence and recovery attempts. Missing online activity is not proof of effort, intent, or ability.

## Core philosophy

1. **Recover the dependency chain first.** The AI prioritizes an unfinished task when other tasks depend on it.
2. **Exchange work; do not simply add work.** A proposed recipient gives up a smaller standalone task when taking the dependency-critical task.
3. **AI chooses the proposal, a person chooses whether to accept it.** The team does not select names from a dropdown, but the proposed recipient retains control.
4. **No response or rejection is not consent.** Ownership stays unchanged until the recipient explicitly accepts and confirms the paired swap.
5. **A rejection routes the proposal, not the task.** Carry On evaluates the next safe candidate. It never records a rejected proposal as a reassignment.
6. **Do not overload the dependable teammate.** A candidate is excluded when the calculated post-swap workload exceeds the safe prototype threshold.
7. **Stop when recovery is unsafe.** If no eligible candidate remains, Carry On recommends a human-reviewed lecturer email instead of forcing redistribution.
8. **Preserve responsibility history.** Both exchanged tasks show their original owner, new owner, accepting member, confirmation time, and paired task.

## Terms

- **Risk owner:** the owner of a task already in `Potential Risk` after repeated evidence and human-visible recovery attempts.
- **Dependency-critical task:** the risk owner's unfinished task with the greatest downstream blocking effect. Weight and deadline break ties.
- **Standalone relief task:** a lower-weight active task with no incoming or outgoing dependency edges.
- **Proposed recipient:** the eligible teammate selected by the AI to receive the dependency-critical task.
- **Paired swap:** the atomic exchange of the dependency-critical task and the recipient's standalone relief task.
- **Safe candidate:** a teammate whose post-swap workload remains within the safe prototype threshold and who owns an eligible standalone task.

## Transparent selection policy

The prototype uses a deterministic local policy so the result is inspectable and repeatable:

1. Locate the owner attached to the selected `Potential Risk` task.
2. Rank that owner's unfinished tasks by:
   - number of direct and indirect downstream tasks;
   - task weight;
   - deadline.
3. For every other teammate, find their lowest-weight standalone task in `Not Started`, `In Progress`, or `Due Soon`.
4. Calculate the recipient's workload after exchanging the two task weights.
5. Remove candidates whose resulting workload exceeds 85%.
6. Rank the remaining candidates by relevant skill match, lowest post-swap workload, then lowest relief-task weight.
7. Present the first proposal and its reasoning as **AI Suggested**.

This is an interactive frontend prototype. The selection policy uses mock task, dependency, and workload data; it does not call a live model, Google Docs, GitHub, or a university system.

## Consent state machine

### Suggested

- Show both tasks, both current owners, both proposed owners, weights, workload before/after, and affected downstream tasks.
- Show `Waiting for Response` as a secondary proposal state.
- Keep both canvas nodes and all ownership data unchanged.
- Only the proposed recipient may accept or reject in a production implementation.

### Rejected

- Record the recipient who declined.
- Do not change task ownership, task state, dependency edges, or workload.
- Move to the next safe candidate automatically.
- Keep earlier declined recipients visible in the proposal history.

### Accepted

- Open an explicit confirmation modal that names both task changes.
- Apply the paired swap atomically; partial swaps are not allowed.
- Mark both tasks `Rebalanced`.
- Preserve original ownership on both task nodes and in their histories.
- Record the accepting recipient and confirmation time.
- Keep lecturer review available when the underlying contribution concern remains unresolved.

### Exhausted

- Enter this state when every safe candidate declines or no eligible candidate exists.
- State clearly that no owner changed and no work was forced onto anyone.
- Offer **Draft Lecturer Email** as the next primary action.
- Never auto-send the email or describe the potential risk as a verdict.

## Visual treatment

- The proposed swap uses the existing AI Suggested treatment: dashed `sage-500` border, pale sage fill, sparkle icon, and advisory explanation.
- `Waiting for Response` uses the existing sand waiting pill.
- Acceptance changes the proposal container to a solid sage confirmed treatment and both affected nodes to `Rebalanced`.
- Rejection history uses a quiet sand surface, not an alarm color.
- Exhaustion remains calm and neutral; muted clay is reserved for actual blocked, overdue, or confirmed escalation semantics.
- No animated or pulsing risk treatment is introduced.

## Non-goals and safeguards

- Do not rank students by productivity.
- Do not use a single missed deadline to start redistribution.
- Do not infer quality or intent from document or repository activity.
- Do not expose a manual recipient dropdown as an override.
- Do not force the next candidate to take ownership after a rejection.
- Do not remove the risk owner from the project or erase their original responsibility.
- Do not automatically escalate, contact the lecturer, or send evidence.
- Do not claim the prototype is using a live AI service.

## Example

`Discussion and interventions` is owned by Daniel and blocks `Feasibility check`, which in turn blocks `Final edit and submission`. Carry On proposes that Ben take the 18% discussion task while Daniel takes Ben's 5% standalone `Appendix formatting` task.

- If Ben rejects, neither task changes. Carry On proposes the next safe paired swap to Clara.
- If Clara accepts, Clara receives `Discussion and interventions`, Daniel receives `Figure notes and alt text`, and both tasks become `Rebalanced` with original ownership preserved.
- If Clara also rejects, Carry On stops and recommends lecturer review.

## Acceptance criteria

- No recipient name selector appears in the redistribution flow.
- The proposal explains the dependency problem and why both tasks were selected.
- Rejecting advances to another eligible recipient without changing ownership.
- Accepting changes both owners together and preserves both histories.
- Exhausting candidates produces a lecturer-review fallback without forced reassignment.
- All actions remain keyboard accessible and usable at 375px, 768px, 1024px, and 1440px.
