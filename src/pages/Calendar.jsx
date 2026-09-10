import { useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Flag, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { calendarTasks, initialTasks, projects, taskTypes } from '../data/mockData'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TYPE_COLORS = { Assignment: '#a4513c', Meeting: '#345b49', Milestone: '#c9932f', Other: '#8a9690' }
const ADDABLE_CALENDAR_TYPES = taskTypes.filter((type) => type !== 'Assignment')

function parseDate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, amount) {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

function buildMonthMatrix(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

function buildWeekRow(viewDate) {
  const weekStart = addDays(viewDate, -viewDate.getDay())
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function formatMonthTitle(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatWeekTitle(days) {
  const start = days[0]
  const end = days[6]
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`
}

function DayCell({ day, monthRef, today, selectedDate, tasksByDate, maxVisible, onSelect }) {
  const key = dateKey(day)
  const dayTasks = tasksByDate[key] || []
  const inMonth = day.getMonth() === monthRef.getMonth()
  const isToday = isSameDay(day, today)
  const isSelected = selectedDate && isSameDay(day, selectedDate)
  const visible = dayTasks.slice(0, maxVisible)
  const hidden = dayTasks.length - visible.length

  return (
    <div
      className={`calendar-cell ${!inMonth ? 'is-outside' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected-cell' : ''}`}
      onClick={() => onSelect(day)}
    >
      <span className={`calendar-cell-date ${isToday ? 'is-today-badge' : ''}`}>{day.getDate()}</span>
      <div className="calendar-cell-tasks">
        {visible.map((task) => (
          <Link
            key={task.id}
            to={`/project/${task.projectId}/canvas`}
            className={`calendar-task-pill cal-pill-${task.type.toLowerCase()}`}
            title={task.title}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="calendar-task-dot" aria-hidden="true" />
            <span className="calendar-task-label">{task.title}</span>
          </Link>
        ))}
        {hidden > 0 && <span className="calendar-more">+{hidden} more</span>}
      </div>
    </div>
  )
}

export default function Calendar() {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [view, setView] = useState('month')
  const [upcomingRange, setUpcomingRange] = useState(30)
  const [addOpen, setAddOpen] = useState(false)
  const [customTasks, setCustomTasks] = useState([])
  const [form, setForm] = useState({ title: '', date: dateKey(today), projectId: projects[0]?.id ?? '', type: 'Meeting' })

  const allTasks = useMemo(() => [...calendarTasks, ...customTasks], [customTasks])
  const projectsById = useMemo(() => Object.fromEntries(projects.map((item) => [item.id, item])), [])

  const tasksByDate = useMemo(() => {
    const map = {}
    allTasks.forEach((task) => {
      if (!map[task.date]) map[task.date] = []
      map[task.date].push(task)
    })
    return map
  }, [allTasks])

  const upcomingTasks = useMemo(() => {
    const limit = addDays(today, upcomingRange)
    return allTasks
      .filter((task) => { const d = parseDate(task.date); return d >= today && d <= limit })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [allTasks, today, upcomingRange])

  const stats = useMemo(() => {
    const next30 = addDays(today, 30)
    const upcomingCount = allTasks.filter((task) => { const d = parseDate(task.date); return d >= today && d <= next30 }).length
    const deadlinesThisMonth = allTasks.filter((task) => {
      const d = parseDate(task.date)
      return (task.type === 'Assignment' || task.type === 'Milestone') && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    }).length
    const tasksInProgress = initialTasks.filter((task) => task.status === 'In Progress').length
    const overdue = allTasks.filter((task) => parseDate(task.date) < today).length
    return [
      { key: 'upcoming', label: 'Upcoming Tasks', value: upcomingCount, suffix: 'Next 30 days', icon: CalendarDays, tone: 'sage' },
      { key: 'deadlines', label: 'Deadlines', value: deadlinesThisMonth, suffix: 'This month', icon: Flag, tone: 'clay' },
      { key: 'progress', label: 'Tasks in Progress', value: tasksInProgress, suffix: 'Across all projects', icon: CheckCircle2, tone: 'sage' },
      { key: 'overdue', label: 'Overdue', value: overdue, suffix: 'Needs attention', icon: CalendarClock, tone: overdue ? 'risk' : 'clay' },
    ]
  }, [allTasks, today])

  const monthMatrix = useMemo(() => buildMonthMatrix(viewDate), [viewDate])
  const monthWeeks = useMemo(() => chunk(monthMatrix, 7), [monthMatrix])
  const weekRow = useMemo(() => buildWeekRow(selectedDate || today), [selectedDate, today])

  function shift(amount) {
    setViewDate((prev) => {
      const next = new Date(prev)
      if (view === 'week') next.setDate(next.getDate() + amount * 7)
      else next.setMonth(next.getMonth() + amount)
      return next
    })
    if (view === 'week') setSelectedDate((prev) => addDays(prev || today, amount * 7))
  }

  function goToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today)
  }

  function handleSelectDay(day) {
    setSelectedDate(day)
    if (day.getMonth() !== viewDate.getMonth()) setViewDate(new Date(day.getFullYear(), day.getMonth(), 1))
  }

  function handleAddTask(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.date || !form.projectId) return
    setCustomTasks((prev) => [...prev, { id: `custom-${Date.now()}`, title: form.title.trim(), date: form.date, projectId: form.projectId, type: form.type }])
    setForm({ title: '', date: dateKey(today), projectId: projects[0]?.id ?? '', type: 'Meeting' })
    setAddOpen(false)
  }

  const listGroups = useMemo(() => {
    const sorted = [...allTasks].sort((a, b) => a.date.localeCompare(b.date))
    const groups = []
    sorted.forEach((task) => {
      const last = groups[groups.length - 1]
      if (last && last.date === task.date) last.items.push(task)
      else groups.push({ date: task.date, items: [task] })
    })
    return groups
  }, [allTasks])

  return (
    <div className="page">
      <PageHeader
        eyebrow="Calendar"
        title="Your upcoming tasks"
        description="Stay on track and never miss a deadline. Here are all your upcoming tasks and milestones."
        actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Task</Button>}
      />

      <div className="calendar-stat-grid">
        {stats.map(({ key, label, value, suffix, icon: Icon, tone }) => (
          <Card key={key} className={`stat-card stat-card-${tone}`}>
            <span className="stat-icon"><Icon size={20} aria-hidden="true" /></span>
            <span className="stat-body">
              <span className="stat-label">{label}</span>
              <span className="stat-value"><strong>{value}</strong></span>
              <span className="stat-suffix">{suffix}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          <Card>
            <div className="calendar-toolbar">
              <div className="calendar-nav">
                <button type="button" className="calendar-nav-btn" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft size={18} aria-hidden="true" /></button>
                <button type="button" className="calendar-nav-btn" onClick={() => shift(1)} aria-label="Next"><ChevronRight size={18} aria-hidden="true" /></button>
                <h2 className="calendar-title">{view === 'week' ? formatWeekTitle(weekRow) : formatMonthTitle(viewDate)}</h2>
              </div>
              <div className="calendar-controls">
                <div className="view-toggle" role="tablist" aria-label="Calendar view">
                  {['month', 'week', 'list'].map((option) => (
                    <button key={option} type="button" className={view === option ? 'active' : ''} onClick={() => setView(option)}>
                      {option[0].toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-secondary" onClick={goToday}>Today</button>
              </div>
            </div>

            {view !== 'list' && (
              <div className="calendar-weekdays">
                {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
              </div>
            )}

            {view === 'month' && (
              <div className="calendar-grid">
                {monthWeeks.flat().map((day) => (
                  <DayCell key={dateKey(day)} day={day} monthRef={viewDate} today={today} selectedDate={selectedDate} tasksByDate={tasksByDate} maxVisible={2} onSelect={handleSelectDay} />
                ))}
              </div>
            )}

            {view === 'week' && (
              <div className="calendar-grid is-week">
                {weekRow.map((day) => (
                  <DayCell key={dateKey(day)} day={day} monthRef={day} today={today} selectedDate={selectedDate} tasksByDate={tasksByDate} maxVisible={8} onSelect={handleSelectDay} />
                ))}
              </div>
            )}

            {view === 'list' && (
              <div className="calendar-list">
                {listGroups.length === 0 && <p className="muted">No tasks yet. Add one to get started.</p>}
                {listGroups.map((group) => {
                  const d = parseDate(group.date)
                  return (
                    <div key={group.date} className="calendar-list-group">
                      <div className="calendar-list-date">
                        <span>{WEEKDAYS_FULL[d.getDay()]}</span>
                        <strong>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                      </div>
                      <div className="calendar-list-items">
                        {group.items.map((task) => (
                          <Link key={task.id} to={`/project/${task.projectId}/canvas`} className="task-row calendar-list-item">
                            <span>
                              <span className={`calendar-task-dot calendar-task-dot-lg cal-dot-${task.type.toLowerCase()}`} aria-hidden="true" />
                              <span className="task-title">{task.title}</span>
                              <span className="task-meta-label" style={{ marginTop: 3 }}>{projectsById[task.projectId]?.title}</span>
                            </span>
                            <span className={`pill cal-pill-${task.type.toLowerCase()}`}>{task.type}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="calendar-legend">
              {taskTypes.map((type) => (
                <span key={type} className="calendar-legend-item">
                  <span className="calendar-legend-dot" style={{ background: TYPE_COLORS[type] }} aria-hidden="true" />
                  {type}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <aside className="calendar-side">
          <Card>
            <div className="upcoming-head">
              <h3 className="upcoming-title">Upcoming Tasks</h3>
              <div className="upcoming-filter">
                <select value={upcomingRange} onChange={(event) => setUpcomingRange(Number(event.target.value))} aria-label="Filter upcoming tasks">
                  <option value={7}>Next 7 days</option>
                  <option value={30}>Next 30 days</option>
                  <option value={365}>All upcoming</option>
                </select>
              </div>
            </div>
            <div className="upcoming-list">
              {upcomingTasks.length === 0 && <p className="muted small" style={{ marginTop: 12 }}>Nothing in this range.</p>}
              {upcomingTasks.map((task) => {
                const d = parseDate(task.date)
                return (
                  <Link key={task.id} to={`/project/${task.projectId}/canvas`} className="upcoming-item">
                    <span className={`upcoming-date-badge cal-pill-${task.type.toLowerCase()}`}>
                      <strong>{d.getDate()}</strong>
                      <span>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </span>
                    <span>
                      <span className="upcoming-item-title">{task.title}</span>
                      <span className="upcoming-subtitle">{projectsById[task.projectId]?.title}</span>
                      <span className={`pill cal-pill-${task.type.toLowerCase()} upcoming-item-type`}>{task.type}</span>
                    </span>
                    <ChevronRight size={16} className="upcoming-item-arrow" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={addOpen}
        title="Add a task"
        onClose={() => setAddOpen(false)}
        actions={<>
          <button type="button" className="btn btn-tertiary" onClick={() => setAddOpen(false)}>Cancel</button>
          <button type="submit" form="add-task-form" className="btn btn-forest">Add Task <ArrowRight size={16} aria-hidden="true" /></button>
        </>}
      >
        <form id="add-task-form" className="stack-sm" onSubmit={handleAddTask}>
          <div>
            <label className="label" htmlFor="task-title">Title</label>
            <input id="task-title" className="field" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="e.g. Draft peer review" required />
          </div>
          <div className="form-grid">
            <div>
              <label className="label" htmlFor="task-date">Date</label>
              <input id="task-date" type="date" className="field" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} required />
            </div>
            <div>
              <label className="label" htmlFor="task-type">Type</label>
              <select id="task-type" className="field" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
                {ADDABLE_CALENDAR_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="task-project">Project</label>
            <select id="task-project" className="field" value={form.projectId} onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
