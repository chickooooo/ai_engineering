import { AppShell } from '../components/layout/AppShell'
import { HealthCheck } from '../features/health/HealthCheck'

export function HomePage() {
  return (
    <AppShell title="Home">
      <HealthCheck />
    </AppShell>
  )
}
