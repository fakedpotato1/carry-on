# Carry On Design System — Master

> Global source of truth for the Carry On coded prototype.
> Before building a route, check `design-system/loadshift/pages/[route-name].md`.
> A page file may override only the rules it names; all other rules remain inherited from this Master.

**Project:** Carry On
**Generated:** 2026-09-06  
**Stack target:** React + Tailwind CSS + Vite  
**Product posture:** Supportive group-assignment recovery tool; evidence-aware, human-controlled, and burnout-preventive. Never frame the interface as surveillance, punishment, or a final judgment of a student.

---

## 1. Design Direction

### Pattern: Calm Guided Workspace

A task-focused workspace that combines a **linear recovery journey** with a **soft modular card layout**. The product story remains visible as a quiet five-stage path: **Prevent → Detect → Recover → Escalate → Improve**. Screens should feel like a supportive study room, not an enterprise control center.

- Use a lightweight left prototype menu on desktop and a compact route drawer/dropdown on mobile.
- Keep each route focused on one decision, with a clear page title, plain-language context, and one primary next action.
- Use cards to group assignment context, people, evidence, and next steps; avoid walls of KPIs.
- Prefer scannable timelines, task rows, comparison panels, and human-readable summaries over analytics-heavy charts.
- Keep the content container consistent at `max-width: 1180px` with generous page whitespace.
- Decorative leaf, wave, or soft asymmetric blob motifs may sit behind empty corners at very low contrast. They must never carry information or reduce readability.

### Style Blend

- **Primary:** Organic Biophilic — natural colors, flowing accents, rounded forms, calm composition.
- **Supporting:** Nature Distilled — muted sage, cream, clay, subtle paper warmth.
- **Structural:** Soft modular grid — clean responsive cards without the visual density of a SaaS dashboard.
- **Interaction:** Restrained micro-interactions — clear feedback, never playful bounce or dramatic motion.

---

## 2. Color System

### Core Palette

| Token | Hex | Use |
|---|---:|---|
| `canvas` | `#F7F4EC` | Main warm-cream page background |
| `surface` | `#FFFEFA` | Primary cards, forms, modal surfaces |
| `surface-subtle` | `#F1F3EC` | Grouped rows and quiet secondary panels |
| `ink` | `#26352E` | Headings and primary body copy |
| `ink-muted` | `#5B6A62` | Secondary copy; do not use below 16px unless contrast is checked |
| `border` | `#D9E0D7` | Default dividers and card borders |
| `sage-700` | `#345B49` | Brand mark, active navigation, high-emphasis neutral actions |
| `sage-500` | `#688876` | Progress, selected controls, supportive emphasis |
| `sage-100` | `#E6EEE8` | Calm highlighted surfaces and completed states |
| `cta` | `#A4513C` | Primary CTA only |
| `cta-hover` | `#87402F` | Primary CTA hover/pressed state |
| `focus` | `#6A8FA3` | Keyboard focus ring only |

### Semantic Status Palette

Status meaning must never rely on color alone. Every status combines a label with an icon or shape treatment.

| Meaning | Background | Text/border | Guidance |
|---|---:|---:|---|
| Neutral / not started | `#F1F3EC` | `#5B6A62` | Quiet neutral pill |
| In progress / review | `#E8EEF0` | `#456371` | Muted blue-grey; informational only |
| Completed / confirmed | `#E6EEE8` | `#345B49` | Sage with check icon |
| Due soon / single miss | `#F6EEDC` | `#805F25` | Sand/ochre, visually lighter than risk |
| Overdue / blocked | `#F3E7E1` | `#825445` | Muted clay, no saturated red |
| Repeated contribution pattern | `#F3E8D3` | `#765523` | Stronger outline plus evidence icon and “Potential Risk” text |
| Rebalanced | `#E7EEEA` | `#3F6554` | Sage with split-arrow icon |
| Escalated | `#EFE7E6` | `#72524E` | Reserved for a user-confirmed escalation only |

### Color Rules

- Terracotta is reserved for the single primary CTA on a page. Do not scatter it across badges, charts, or decoration.
- Red is never a default accent. Muted clay is allowed only for overdue, blocked, or user-confirmed escalation contexts.
- A single missed deadline appears as a small sand status. It must not share the stronger outlined container used for a repeated contribution-risk pattern.
- “Attention Needed” uses factual copy, a warm neutral border, and an evidence icon—not alarm-red banners.
- Maintain WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text and UI boundaries.

---

## 3. Typography

### Font Pairing

- **Display / page headings:** `Lora`, weights 500–600. Organic curves add warmth without becoming playful.
- **UI / body:** `Source Sans 3`, weights 400–700. Humanist, highly readable, and compact enough for task and evidence screens.
- **Fallbacks:** Lora → Georgia → serif; Source Sans 3 → Segoe UI → system-ui → sans-serif.
- Load web fonts with `font-display: swap`; reserve compatible fallbacks to minimize layout shift.

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Source+Sans+3:wght@400;500;600;700&display=swap');
```

### Type Scale

| Role | Desktop | Mobile | Weight / line height |
|---|---:|---:|---|
| Display | 40px | 32px | Lora 600 / 1.15 |
| Page title | 32px | 28px | Lora 600 / 1.2 |
| Section title | 22px | 20px | Source Sans 3 700 / 1.3 |
| Card title | 18px | 18px | Source Sans 3 600 / 1.35 |
| Body | 16px | 16px | Source Sans 3 400 / 1.55 |
| Small / metadata | 14px | 14px | Source Sans 3 500 / 1.45 |
| Label | 13px | 13px | Source Sans 3 700 / 1.3, slight letter spacing |

- Use sentence case throughout. Avoid all-caps headings; reserve uppercase only for very short metadata labels when necessary.
- Avoid childish rounded display fonts and corporate-cold condensed typography.

---

## 4. Shape, Spacing, and Elevation

### Spacing Tokens

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`

- Page gutters: 24px mobile, 32px tablet, 40px desktop.
- Card padding: 20px mobile, 24px desktop.
- Major section gaps: 32–40px.
- Form field gap: 20px; label-to-input gap: 8px.
- Minimum interactive target: 44×44px.

### Radius Tokens

| Token | Value | Use |
|---|---:|---|
| `radius-sm` | 10px | Inputs, compact pills |
| `radius-md` | 16px | Buttons, task rows, standard cards |
| `radius-lg` | 22px | Hero/project cards, modals, major panels |
| `radius-organic` | `28px 20px 26px 18px` | Decorative non-interactive background shapes only |

### Shadows and Borders

- Default card: `1px solid #D9E0D7` plus `0 6px 24px rgba(38,53,46,.06)`.
- Raised/modal: `0 20px 55px rgba(38,53,46,.14)`.
- Avoid hard black shadows, glassmorphism, inset neumorphic controls, and excessive elevation.
- Cards that are not clickable must not gain hover elevation.

---

## 5. Shared Component Rules

### Buttons

- **Primary:** terracotta fill, white text, 16px radius, 44px minimum height. One primary CTA per decision area.
- **Secondary:** surface fill, sage border/text.
- **Tertiary:** text-only sage action with an underline or background tint on hover.
- **Destructive/escalation:** never use a primary red button. Use a confirmation modal and muted clay treatment with explicit consequence copy.
- Disabled/loading buttons keep their width, show a spinner, expose `aria-busy`, and prevent duplicate submission.
- Hover uses color/shadow only; no scale or position shift.

### Cards

- Surface background, quiet border, soft shadow, 16–22px radius.
- Clickable cards use a visible focus ring, pointer cursor, and border/shadow transition.
- AI suggestions use the dedicated treatment below rather than a normal confirmed card.

### AI Suggested / Advisory

- Use a dashed `sage-500` border, pale sage fill, sparkle/circuit SVG icon, and a visible **AI Suggested** or **AI Advisory** label.
- Include one sentence explaining what the AI used and that people decide.
- Never style AI output like a confirmed state.
- Team-confirmed decisions switch to a solid border, confirmation icon, timestamp, and “Confirmed by team” label.

### Status Pills

- 28–32px height, icon + text, compact rounded rectangle rather than loud capsule.
- Use the semantic palette above and preserve text labels at every viewport.
- `Potential Risk` may only appear alongside a factual evidence summary or link.

### Progress Bars

- 8px height, rounded track `#E1E6DF`, sage fill.
- Always pair with a numeric percentage and plain-language label.
- Never imply that document/GitHub activity equals contribution quality.

### Forms

- Persistent labels above controls; placeholders are examples, never replacements for labels.
- 48px minimum field height, surface fill, visible border, 16px input text.
- Validate on blur and explain errors without blame.
- Report/Coding toggles use icons, labels, and selected borders—not color alone.
- Use controlled React inputs for all editable prototype forms.

### Modals

- Use for revised-plan activation, Load Shift confirmation, and escalation only.
- Trap focus, focus the title or first field on open, close with Escape, and return focus to the trigger.
- State what changes, what remains in history, and which action the user is confirming.

### Timelines and Evidence

- Neutral chronological entries with date/time, actor/source, factual event, and optional evidence link.
- Separate observed activity from interpretation.
- Preserve original task ownership after any redistribution.
- Use connectors and icons, not alternating decorative zigzags.

---

## 6. Product-Specific UX Guardrails

1. Never definitively label a person a free rider. Use **Potential Contribution Risk** or **Attention Needed**.
2. Risk requires a visible factual pattern: repeated missed commitments, no response, lack of expected activity, and documented recovery attempts. A single miss remains a lighter due/overdue state.
3. Google Docs and GitHub events are evidence signals, not proof of effort or quality.
4. AI task plans, cross-checks, rubric scores, risk summaries, redistribution proposals, and email drafts are always advisory.
5. Revised responsibilities and escalation require explicit confirmation; no silent activation.
6. After a Load Shift, show both “Originally assigned to” and “Reassigned to,” with time and confirming members.
7. Lecturer email drafts are editable and never auto-sent. Primary actions are **Copy draft** or **Export draft**, preceded by review copy.
8. Use supportive language: “help the team recover,” “make the next step manageable,” and “review the evidence.” Avoid “catch,” “expose,” “guilty,” “lazy,” and shame-based copy.

---

## 7. Motion and Feedback

- Standard transition: 180–220ms ease-out for color, border, opacity, and shadow.
- Loading longer than 300ms shows a spinner or skeleton plus specific status copy such as “Analyzing requirements.”
- Mock AI analysis should progress through 2–3 plain-language steps and disable duplicate actions.
- Success changes use a brief check animation or toast and a persistent updated state; never rely on a toast alone.
- Respect `prefers-reduced-motion`; remove decorative motion and shorten essential transitions.
- No bouncing, pulsing risk alerts, parallax, hover scaling, or gesture-only controls.

---

## 8. Responsive and Accessibility Rules

- Test at 375px, 768px, 1024px, and 1440px; no horizontal page scrolling.
- Collapse desktop navigation into an accessible drawer or select-style prototype menu on small screens.
- Stack before/after comparison cards vertically on mobile while preserving clear labels.
- Task tables become labeled cards on mobile; do not hide owners, deadlines, status, or weight.
- Use semantic landmarks (`header`, `nav`, `main`, `aside`) and real `button`, `a`, `label`, and form elements.
- All SVG icons are decorative with `aria-hidden` when adjacent text supplies the label; icon-only buttons require an accessible name.
- Focus ring: 3px `#6A8FA3` with 2px surface offset.
- Never encode status, assignment type, or severity using color alone.

---

## 9. Iconography

- Use **Lucide React** only, 1.75–2px stroke, normally 18–22px.
- Suggested motifs: leaf/wave for brand, file text for reports, Git branch for coding, users for agreement, history for evidence, split arrows for Load Shift.
- Do not use emoji, hand-drawn clip art, mixed icon libraries, or guessed third-party logos.

---

## 10. Anti-Patterns — Do Not Use

- Generic enterprise SaaS dashboard composition, dense KPI walls, or monitoring-console language.
- Dark mode, black/navy chrome, neon accents, glow effects, glassmorphism, or harsh gradients.
- Saturated red default alerts, flashing/pulsing risk states, traffic-light-only severity, or accusatory badges.
- “Free rider detected,” guilt scores, leaderboards, productivity rankings, or gamified punishment.
- Treating one missed deadline as a repeated pattern.
- AI output that resembles a final decision or silently updates responsibilities.
- Auto-sending lecturer email, automatic escalation, or hidden confirmation steps.
- Removing or overwriting original responsibility after redistribution.
- Low-contrast pastel text, placeholder-only forms, emoji icons, layout-shifting hover transforms, or invisible focus states.
- Complex onboarding, real-looking OAuth permission scope screens, or backend features outside the prototype brief.

---

## 11. Pre-Delivery Checklist

- [ ] All 16 routes are reachable from the prototype menu and through the intended flow.
- [ ] Shared Button, Card, StatusPill, ProgressBar, Modal, AIAdvisory, and Timeline components are reused.
- [ ] Every AI-generated region is visually labelled advisory/suggested.
- [ ] Single deadline issues and repeated contribution-risk patterns have visibly different severity.
- [ ] Risk screens show factual evidence and the “not a final judgment” statement.
- [ ] Load Shift and revised-plan activation require confirmation and preserve original ownership history.
- [ ] Lecturer draft is editable and cannot auto-send.
- [ ] No emoji icons; Lucide icon sizes and strokes are consistent.
- [ ] Keyboard focus, modal focus management, labels, semantic HTML, and contrast are checked.
- [ ] Responsive checks pass at 375px, 768px, 1024px, and 1440px.
- [ ] Motion respects reduced-motion preferences and no hover causes layout shift.

