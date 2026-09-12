import { AppShell } from './components/layout/AppShell'
import { HealthCheck } from './features/health/HealthCheck'

export default function App() {
  return (
    <AppShell title="Home">
      <HealthCheck />
    </AppShell>
  )
}
