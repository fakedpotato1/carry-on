import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import Calendar from './pages/Calendar'
import CreateProject from './pages/CreateProject'
import Dashboard from './pages/Dashboard'
import EvidencePack from './pages/EvidencePack'
import LecturerEmail from './pages/LecturerEmail'
import ProjectCanvas from './pages/ProjectCanvas'
import Profile from './pages/Profile'
import RubricEvaluation from './pages/RubricEvaluation'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="profile" element={<Profile />} />
        <Route path="project/new" element={<CreateProject />} />
        <Route path="project/:id/canvas" element={<ProjectCanvas />} />
        <Route path="project/:id/evidence" element={<EvidencePack />} />
        <Route path="project/:id/lecturer-email" element={<LecturerEmail />} />
        <Route path="project/:id/rubric-evaluation" element={<RubricEvaluation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
