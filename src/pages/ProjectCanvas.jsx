import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  Background, Controls, MarkerType, MiniMap, ReactFlow, addEdge, reconnectEdge,
  useEdgesState, useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Check, ChevronDown, ChevronUp, FileCheck2, FileText, Mail, Plus, Sparkles, Trash2 } from 'lucide-react'
import AIAdvisory from '../components/AIAdvisory'
import Button from '../components/Button'
import Modal from '../components/Modal'
import StatusPill from '../components/StatusPill'
import TaskNode from '../components/TaskNode'
import TaskPanel from '../components/TaskPanel'
import { initialTasks, project, taskDependencies, team } from '../data/mockData'

const nodeTypes = { task: TaskNode }
const ownerColumns = team.map((member) => member.name)
const ownerX = Object.fromEntries(ownerColumns.map((owner, index) => [owner, index * 340]))

const makeNodes = (mode) => {
  const ownerCounts = {}
  return initialTasks.map((task) => {
    const row = ownerCounts[task.owner] || 0
    ownerCounts[task.owner] = row + 1
    return {
      id: task.id,
      type: 'task',
      position: { x: ownerX[task.owner], y: 76 + row * 245 },
      data: { task: { ...task, suggested: mode === 'draft' }, mode },
    }
  })
}

function edgePresentation(status, mode) {
  if (mode === 'draft') return { style: { stroke: '#688876', strokeWidth: 2, strokeDasharray: '7 7' }, className: '' }
  if (status === 'Completed') return { style: { stroke: '#345B49', strokeWidth: 2.2 }, className: '' }
  if (status === 'In Progress' || status === 'Due Soon' || status === 'Ready for Review') return { style: { stroke: '#688876', strokeWidth: 2.2, strokeDasharray: '8 7' }, className: 'edge-flowing' }
  if (status === 'Blocked' || status === 'Overdue') return { style: { stroke: '#825445', strokeWidth: 2, opacity: .4 }, className: '' }
  if (status === 'Rebalanced') return { style: { stroke: '#3F6554', strokeWidth: 2.2 }, className: '' }
  return { style: { stroke: '#D9E0D7', strokeWidth: 2 }, className: '' }
}

const makeEdges = (nodes, mode) => taskDependencies.map(([source, target], index) => {
  const targetStatus = nodes.find((node) => node.id === target)?.data.task.status
  return {
    id: `dependency-${index}`,
    source,
    target,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: mode === 'draft' ? '#688876' : '#8DA098' },
    ...edgePresentation(targetStatus, mode),
  }
})

export default function ProjectCanvas() {
  const { id = project.id } = useParams()
  const location = useLocation()
  const [mode, setMode] = useState(location.state?.mode === 'draft' ? 'draft' : 'active')
  const firstNodes = useMemo(() => makeNodes(location.state?.mode === 'draft' ? 'draft' : 'active'), [])
  const [nodes, setNodes, onNodesChange] = useNodesState(firstNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges(firstNodes, mode))
  const [selectedId, setSelectedId] = useState(null)
  const [legendOpen, setLegendOpen] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState('')

  const selectedNode = nodes.find((node) => node.id === selectedId)
  const selectedTask = selectedNode?.data.task
  const unconfirmed = nodes.filter((node) => node.data.task.suggested).length

  useEffect(() => {
    setEdges((current) => current.map((edge) => {
      const status = nodes.find((node) => node.id === edge.target)?.data.task.status
      return { ...edge, ...edgePresentation(status, mode) }
    }))
  }, [mode, nodes, setEdges])

  const onConnect = useCallback((connection) => setEdges((current) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, ...edgePresentation('Not Started', mode) }, current)), [mode, setEdges])
  const onReconnect = useCallback((oldEdge, connection) => setEdges((current) => reconnectEdge(oldEdge, connection, current)), [setEdges])

  const updateTask = useCallback((taskId, key, value) => {
    setNodes((current) => current.map((node) => node.id === taskId ? {
      ...node,
      data: { ...node.data, task: { ...node.data.task, [key]: value, suggested: key === 'suggested' ? value : false } },
    } : node))
  }, [setNodes])

  const addTask = () => {
    const id = `task-${Date.now()}`
    setNodes((current) => [...current, {
      id, type: 'task', position: { x: 0, y: 76 + current.length * 36 },
      data: { mode, task: { id, title: 'New task', owner: ownerColumns[0], deadline: '15 Sep', deliverable: 'Define the expected outcome', weight: 10, status: 'Not Started', suggested: true } },
    }])
    setSelectedId(id)
  }

  const deleteTask = (taskId) => {
    setNodes((current) => current.filter((node) => node.id !== taskId))
    setEdges((current) => current.filter((edge) => edge.source !== taskId && edge.target !== taskId))
    setSelectedId(null)
  }

  const handleDragStop = (_, node) => {
    if (mode !== 'draft') return
    const columnIndex = Math.max(0, Math.min(ownerColumns.length - 1, Math.round(node.position.x / 340)))
    updateTask(node.id, 'owner', ownerColumns[columnIndex])
  }

  const activatePlan = () => {
    setMode('active')
    setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, mode: 'active', task: { ...node.data.task, suggested: false } } })))
    setConfirmOpen(false)
    setToast('Plan confirmed. The canvas is now active.')
  }

  const rebalance = (newOwner) => {
    if (!selectedTask) return
    setNodes((current) => current.map((node) => node.id === selectedId ? {
      ...node,
      data: { ...node.data, task: { ...node.data.task, originalOwner: node.data.task.originalOwner || node.data.task.owner, owner: newOwner, status: 'Rebalanced' } },
    } : node))
    setToast(`Load Shift confirmed. Original ownership remains in ${selectedTask.title} history.`)
  }

  const dependencies = selectedId ? edges.filter((edge) => edge.target === selectedId).map((edge) => nodes.find((node) => node.id === edge.source)?.data.task.title).filter(Boolean) : []

  return (
    <div className="canvas-page">
      <header className="canvas-header">
        <div><div className="canvas-title-line"><h1>{project.title}</h1><span className={`mode-badge mode-${mode}`}>{mode === 'draft' ? <Sparkles size={14} /> : <Check size={14} />}{mode === 'draft' ? 'Draft plan' : 'Active project'}</span></div><p>{mode === 'draft' ? 'Shape the AI-suggested plan. Drag tasks between owner lanes, edit details, or redraw dependencies.' : 'Live task state, dependencies, evidence, review, and recovery in one workspace.'}</p></div>
        <div className="canvas-toolbar" aria-label="Project tools">
          <Button to={`/project/${id}/evidence`} variant="secondary" icon={FileText}>Evidence Pack</Button>
          <Button to={`/project/${id}/lecturer-email`} variant="secondary" icon={Mail}>Draft Lecturer Email</Button>
          <Button to={`/project/${id}/rubric-evaluation`} variant="secondary" icon={FileCheck2}>Rubric Evaluation</Button>
        </div>
      </header>

      {mode === 'draft' && <AIAdvisory className="canvas-advisory" label="AI Suggested" title="Drafted from the assignment brief and rubric"><p>These tasks balance rubric weight and dependencies. People decide: review each suggestion, then explicitly confirm the plan.</p></AIAdvisory>}

      {mode === 'draft' && <div className="canvas-actions">
        <div className="button-row"><Button variant="secondary" icon={Plus} onClick={addTask}>Add task</Button>{mode === 'draft' && selectedId && <Button variant="clay" icon={Trash2} onClick={() => deleteTask(selectedId)}>Delete selected</Button>}</div>
        {mode === 'draft' && <div className="confirm-plan-wrap"><span>{unconfirmed} AI suggestion{unconfirmed === 1 ? '' : 's'} remaining</span><Button onClick={() => setConfirmOpen(true)}>Confirm Plan</Button></div>}
      </div>}

      <section className="flow-shell" aria-label={`${mode} project task canvas`}>
        {mode === 'draft' && <div className="owner-lanes" aria-hidden="true">{ownerColumns.map((owner) => <span key={owner}>{owner}</span>)}</div>}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          onNodeDragStop={handleDragStop}
          onPaneClick={() => setSelectedId(null)}
          nodesDraggable={mode === 'draft'}
          nodesConnectable={mode === 'draft'}
          edgesReconnectable={mode === 'draft'}
          edgesFocusable
          deleteKeyCode={mode === 'draft' ? ['Backspace', 'Delete'] : null}
          fitView
          fitViewOptions={{ padding: .18, minZoom: .55 }}
          minZoom={.5}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#CAD4CC" gap={22} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={(node) => node.data.task.status === 'Potential Risk' ? '#F3E8D3' : '#E6EEE8'} />
        </ReactFlow>
        <div className={`canvas-legend ${legendOpen ? 'open' : ''}`}>
          <button type="button" onClick={() => setLegendOpen(!legendOpen)} aria-expanded={legendOpen}>{legendOpen ? <ChevronDown size={17} /> : <ChevronUp size={17} />}Status legend</button>
          {legendOpen && <div>{['Not Started', 'In Progress', 'Ready for Review', 'Completed', 'Due Soon', 'Blocked', 'Potential Risk', 'Rebalanced'].map((status) => <StatusPill key={status} status={status} />)}</div>}
        </div>
      </section>

      {selectedTask && <TaskPanel task={selectedTask} mode={mode} dependencies={dependencies} onClose={() => setSelectedId(null)} onUpdate={(key, value) => updateTask(selectedId, key, value)} onRebalance={rebalance} />}

      <Modal open={confirmOpen} title="Confirm and activate this plan?" onClose={() => setConfirmOpen(false)} actions={<><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep editing</Button><Button icon={Check} onClick={activatePlan}>Confirm and activate</Button></>}>
        <p>This locks task editing and turns the same canvas into the live project view. Current owners, outcomes, dependencies, and node positions will remain visible.</p>
        {unconfirmed > 0 && <div className="notice notice-attention"><div><strong>{unconfirmed} AI suggestion{unconfirmed === 1 ? '' : 's'} will be team-confirmed.</strong><p>Confirm only after the team has reviewed these responsibilities.</p></div></div>}
      </Modal>
      {toast && <div className="toast" role="status"><Check size={18} aria-hidden="true" />{toast}</div>}
    </div>
  )
}
