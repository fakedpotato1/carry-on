# Project Mindmap Specification

> Page-level specification for the Project Mindmap inside `/project/:id/canvas`.
> This file inherits `design-system/loadshift/MASTER.md`. The Master remains authoritative for colors, accessibility, AI treatment, risk language, and motion.

## 1. Purpose

The Project Mindmap gives a team one shared view of its tasks, owners, expected outcomes, deadlines, progress states, and dependencies. It supports planning in Draft mode and day-to-day progress updates in Active mode.

The mindmap is not a productivity score or surveillance view. Google Docs and GitHub events are evidence signals only and do not prove effort, quality, or intent.

## 2. Canvas anatomy

- Each node represents one task.
- Each connector represents a dependency from an earlier task to a dependent task.
- A connector's appearance is determined by the current state of its destination task.
- Clicking a node opens its slide-over panel without leaving the canvas.
- The canvas supports pan, zoom, minimap navigation, and keyboard focus.
- The corner legend summarizes task states without replacing the text labels on nodes.

## 3. Draft mode

Draft mode is used before the team selects **Confirm Plan**.

- Every proposed task uses the AI Suggested treatment: pale sage background, dashed sage border, sparkle icon, and visible `AI Suggested` label.
- AI suggestions are advisory. People may edit task details, add or delete tasks, drag tasks into owner lanes, and create, reconnect, or delete dependency edges.
- Editing a proposed task marks that task as `Confirmed by team`.
- **Confirm Plan** opens an explicit confirmation dialog and changes the same canvas into Active mode without moving the nodes.
- Progress-state controls are not shown in Draft mode because the plan is not active yet.

## 4. Active mode

Active mode shows the confirmed plan and current project state.

- Node positions and dependencies remain visible.
- Clicking a task opens details, evidence, and any state-specific controls.
- Every Active task can be moved by a user into one of only three ordinary workflow states:
  1. `Not Started`
  2. `In Progress`
  3. `Ready for Review`
- A state change must immediately update the node pill, node treatment, and all incoming dependency connectors for that task.
- Selecting `Ready for Review` must immediately reveal the Cross-check section in the task panel.
- Changes are session-local in this prototype and reset when the page is reloaded. Backend persistence is outside the current prototype scope.

## 5. User-editable workflow states

| Pill | Icon and treatment | Meaning | Incoming connector |
|---|---|---|---|
| `Not Started` | Circle icon; neutral surface and grey text/border | The team has not started the agreed task. | Solid light-grey line. |
| `In Progress` | Play icon; muted blue-grey pill and sage-tinted node | Work on the agreed outcome is underway. | Moving dashed sage line. Static dashed sage when reduced motion is preferred. |
| `Ready for Review` | Eye icon; muted blue-grey review pill | The owner says the outcome is ready for a teammate to cross-check. This is not completion. | Moving dashed sage line. Static dashed sage when reduced motion is preferred. |

The current pill in the slide-over panel's **Details** heading is the status control. Selecting that pill opens exactly three labelled choices with their icons. Color is never the only indicator, and the current choice is exposed with `aria-checked="true"` plus a check icon.

## 6. System-managed and review-managed states

These states may appear in the canvas but are not choices in the user's three-state progress control. Their meaning must not be weakened by presenting them as ordinary manual progress choices. If a task currently has one of these states, the panel explains its source and still lets the team move the task back into one of the three ordinary workflow stages. No special state is added as a fourth choice.

| Pill | Meaning | How it changes |
|---|---|---|
| `Completed` | The outcome has passed the required team/review completion step. | Set by a completion or review workflow, not the manual progress selector. |
| `Due Soon` | A deadline is close or there is a single lighter timing concern. | Set from timing information; it is visually lighter than Potential Risk. |
| `Blocked` | A dependency or external issue prevents progress. | Set by blocking logic or a dedicated recovery action. |
| `Overdue` | The agreed deadline has passed without completion. | Set from deadline information. |
| `Potential Risk` | A repeated, factual unresolved contribution pattern needs human review. It is not a final judgment. | Requires visible evidence and human review; never inferred from one missed deadline. |
| `Rebalanced` | A confirmed Load Shift changed the active owner while preserving the original owner in history. | Set only after explicit Load Shift confirmation. |
| `Escalated` | The team explicitly confirmed an escalation. | Set only by the escalation flow. |
| `Waiting for Response` | A response is needed before the next step. | Set by the relevant communication/recovery workflow. |

When a task is in one of these states, the task panel shows the current pill and explains that the state is managed by its relevant workflow. The ordinary three-state selector is not shown.

## 7. Connector meanings

Connectors point toward the dependent task. Read a connector as: **the destination task depends on the source task, and the line treatment summarizes the destination task's current state.**

| Connector appearance | Meaning |
|---|---|
| Dashed sage line in Draft mode | The dependency is part of the unconfirmed or editable proposed plan. This line is static. |
| Moving dashed sage line in Active mode | The destination task is `In Progress`, `Ready for Review`, or in another active timing state such as `Due Soon`. The moving dashes mean work is actively flowing toward the dependent outcome; they do not measure speed or effort. |
| Static dashed sage line with reduced motion | Same meaning as the moving dashed line. Animation is removed for users who prefer reduced motion. |
| Solid light-grey line | No active connector flow is being claimed. This is used for `Not Started` and for states, such as `Potential Risk`, whose meaning is carried by the node and pill rather than the connector. |
| Solid dark-sage line | The destination task is `Completed` or `Rebalanced`. The dependency remains part of the project history. |
| Dimmed muted-clay line | The destination task is `Blocked` or `Overdue`. It is deliberately receded to show interrupted flow. Although it may look red-brown, it is the approved muted-clay color, not an alarm-red error line and not a judgment about a person. |

## 8. Node-specific panel behavior

- **Details:** owner, deadline, expected outcome, dependencies, and weight.
- **Task status:** shown for every task in Active mode and limited to the three user-editable workflow choices. A special current state is explained above the choices.
- **Evidence:** factual Google Docs/GitHub activity relevant to the task, separated from interpretation.
- **Cross-check:** shown when the task is `Ready for Review`; includes `Meets` and `Needs revision`, reviewer comments, and an optional clearly labelled AI Advisory check.
- **Potential Risk:** shows the factual pattern, the statement `This is not a final judgment`, and a recovery-first **Try Load Shift** action.
- **Load Shift:** shows the urgent task, proposed new owner, before/after workload, manual owner override, and explicit confirmation. Original ownership remains visible after confirmation.

## 9. Accessibility and motion

- The Details-heading status pill is a real menu button; its choices expose the selected state with `aria-checked`.
- Each state always includes text and an icon; status never relies on color alone.
- Controls have visible keyboard focus and at least a 44px target size.
- The task panel remains a slide-over, not a modal, and has a labelled close button.
- Flow animation uses `stroke-dashoffset` only.
- `prefers-reduced-motion: reduce` replaces moving dashes with a static dashed line.
- Status updates are persistent in the visible node and announced through a polite live region or status message.

## 10. Acceptance criteria

- An Active-mode `Not Started` task can switch to `In Progress` and `Ready for Review`, and back to either ordinary workflow state.
- Exactly three manual status choices are presented.
- The selected task's pill and node styling update immediately.
- Incoming connectors update immediately: grey solid for `Not Started`; moving/static dashed sage for `In Progress` and `Ready for Review`.
- `Ready for Review` reveals the Cross-check section without navigation or reload.
- System-managed states are displayed but are not included as manual choices; a task in one of those states can still be moved into an ordinary workflow stage.
- Reloading the page restores mock data because status persistence is intentionally session-local.
- Behavior and layout work at 375px, 768px, 1024px, and 1440px.
