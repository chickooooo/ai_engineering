import { Route, Routes } from 'react-router'
import { HomePage } from './pages/HomePage'
import { ManageModelsPage } from './pages/ManageModelsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/models" element={<ManageModelsPage />} />
    </Routes>
  )
}
