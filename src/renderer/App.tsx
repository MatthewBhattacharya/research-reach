import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProfilePage } from './pages/ProfilePage'
import { SearchPage } from './pages/SearchPage'
import { ProfessorListPage } from './pages/ProfessorListPage'
import { ProfessorDetailPage } from './pages/ProfessorDetailPage'
import { EmailComposerPage } from './pages/EmailComposerPage'
import { EmailHistoryPage } from './pages/EmailHistoryPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search/:searchId/professors" element={<ProfessorListPage />} />
        <Route path="/professor/:professorId" element={<ProfessorDetailPage />} />
        <Route path="/professor/:professorId/email" element={<EmailComposerPage />} />
        <Route path="/emails" element={<EmailHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
