import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ManageModelsPage } from '../../src/pages/ManageModelsPage'
import { server } from '../mocks/server'
import { rowFor } from '../rows'
import { renderWithProviders } from '../utils'

async function openPage(view = '') {
  const route = view ? `/models?view=${view}` : '/models'
  const rendered = renderWithProviders(<ManageModelsPage />, { route })
  await screen.findByRole('tablist')

  return rendered
}

function emptyLists() {
  server.use(
    http.get('/api/providers', () => HttpResponse.json([])),
    http.get('/api/models', () => HttpResponse.json([])),
  )
}

describe('<ManageModelsPage />', () => {
  it('opens on the providers tab', async () => {
    await openPage()

    expect(screen.getByRole('tab', { name: /Providers/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('heading', { name: 'Providers' })).toBeVisible()
  })

  it('shows one view at a time', async () => {
    await openPage()

    expect(
      screen.queryByRole('heading', { name: 'Models' }),
    ).not.toBeInTheDocument()
  })

  it('opens the models tab when the url asks for it', async () => {
    await openPage('models')

    expect(screen.getByRole('heading', { name: 'Models' })).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Providers' }),
    ).not.toBeInTheDocument()
  })

  it('falls back to providers for an unknown view', async () => {
    await openPage('nonsense')

    expect(screen.getByRole('heading', { name: 'Providers' })).toBeVisible()
  })

  it('switches view when a tab is clicked', async () => {
    const { user } = await openPage()

    await user.click(screen.getByRole('tab', { name: /Models/ }))

    expect(screen.getByRole('heading', { name: 'Models' })).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Providers' }),
    ).not.toBeInTheDocument()
  })

  it('counts the rows on each tab', async () => {
    await openPage()

    const providers = screen.getByRole('tab', { name: /Providers/ })
    const models = screen.getByRole('tab', { name: /Models/ })

    expect(within(providers).getByText('2')).toBeVisible()
    expect(within(models).getByText('1')).toBeVisible()
  })

  it('ties each panel to the tab that opened it', async () => {
    await openPage()

    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'tab-providers',
    )
  })

  it('lists the providers the backend returns', async () => {
    await openPage()

    expect(screen.getByText('ANTHROPIC')).toBeVisible()
    expect(screen.getByText('OPEN_AI')).toBeVisible()
  })

  it('lists the models with their provider', async () => {
    await openPage('models')

    expect(rowFor('claude-haiku-4-5').getByText('ANTHROPIC')).toBeVisible()
  })

  it('says so when nothing has been added yet', async () => {
    emptyLists()
    await openPage()

    expect(screen.getByText('No providers yet.')).toBeVisible()
  })

  it('cannot add a model before there is a provider', async () => {
    emptyLists()
    await openPage('models')

    expect(screen.getByRole('button', { name: /New model/ })).toBeDisabled()
    expect(screen.getByText('Add a provider first.')).toBeVisible()
  })

  it('explains a failure to load', async () => {
    server.use(
      http.get('/api/providers', () => new HttpResponse(null, { status: 500 })),
    )

    renderWithProviders(<ManageModelsPage />, { route: '/models' })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Could not load providers and models/,
    )
  })
})
