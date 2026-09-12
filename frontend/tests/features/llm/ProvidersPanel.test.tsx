import { screen } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ProvidersPanel } from '../../../src/features/llm/ProvidersPanel'
import { anthropic, openai } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import { rowFor } from '../../rows'
import { renderWithProviders } from '../../utils'

describe('<ProvidersPanel />', () => {
  it('opens a form for a new provider', async () => {
    const { user } = renderWithProviders(<ProvidersPanel providers={[]} />)

    await user.click(screen.getByRole('button', { name: /New provider/ }))

    expect(screen.getByRole('dialog', { name: 'New provider' })).toBeVisible()
  })

  it('sends the typed name when the form is saved', async () => {
    let sent: unknown
    server.use(
      http.post('/api/providers', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(anthropic, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<ProvidersPanel providers={[]} />)
    await user.click(screen.getByRole('button', { name: /New provider/ }))
    await user.type(screen.getByLabelText('Name'), 'GEMINI')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(sent).toEqual({ name: 'GEMINI' })
  })

  it('closes the form once the provider is saved', async () => {
    const { user } = renderWithProviders(<ProvidersPanel providers={[]} />)
    await user.click(screen.getByRole('button', { name: /New provider/ }))
    await user.type(screen.getByLabelText('Name'), 'GEMINI')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByRole('button', { name: /New provider/ }),
    ).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the edit form filled in', async () => {
    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic]} />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText('Name')).toHaveValue('ANTHROPIC')
  })

  it('saves an edited name as a patch', async () => {
    let sent: unknown
    server.use(
      http.patch('/api/providers/1', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(anthropic)
      }),
    )

    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic]} />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'ANTHROPIC_EU')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(sent).toEqual({ name: 'ANTHROPIC_EU' })
  })

  it('shows the conflict the backend reports', async () => {
    server.use(
      http.post('/api/providers', () =>
        HttpResponse.json({ detail: 'already exists' }, { status: 409 }),
      ),
    )

    const { user } = renderWithProviders(<ProvidersPanel providers={[]} />)
    await user.click(screen.getByRole('button', { name: /New provider/ }))
    await user.type(screen.getByLabelText('Name'), 'ANTHROPIC')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it('closes the form on cancel without saving', async () => {
    const { user } = renderWithProviders(<ProvidersPanel providers={[]} />)
    await user.click(screen.getByRole('button', { name: /New provider/ }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('retires an active provider', async () => {
    let called = false
    server.use(
      http.delete('/api/providers/1', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic]} />,
    )
    await user.click(screen.getByRole('button', { name: 'Retire ANTHROPIC' }))

    expect(called).toBe(true)
  })

  it('offers to restore a retired provider instead', async () => {
    let sent: unknown
    server.use(
      http.patch('/api/providers/2', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ...openai, is_active: true })
      }),
    )

    const { user } = renderWithProviders(
      <ProvidersPanel providers={[openai]} />,
    )

    expect(
      screen.queryByRole('button', { name: 'Retire OPEN_AI' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Restore OPEN_AI' }))

    expect(sent).toEqual({ is_active: true })
  })

  it('disables the save button while the request is in flight', async () => {
    server.use(
      http.post('/api/providers', async () => {
        await delay(50)
        return HttpResponse.json(anthropic, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(<ProvidersPanel providers={[]} />)
    await user.click(screen.getByRole('button', { name: /New provider/ }))
    await user.type(screen.getByLabelText('Name'), 'GEMINI')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled()
  })

  it('narrows the list by name', async () => {
    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic, openai]} />,
    )

    await user.type(screen.getByLabelText('Search providers'), 'open')

    expect(screen.queryByText('ANTHROPIC')).not.toBeInTheDocument()
    expect(screen.getByText('OPEN_AI')).toBeVisible()
  })

  it('narrows the list by status', async () => {
    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic, openai]} />,
    )

    await user.selectOptions(
      screen.getByLabelText('Filter providers by status'),
      'retired',
    )

    expect(screen.queryByText('ANTHROPIC')).not.toBeInTheDocument()
    expect(screen.getByText('OPEN_AI')).toBeVisible()
  })

  it('says how many rows survived the filters', async () => {
    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic, openai]} />,
    )

    await user.type(screen.getByLabelText('Search providers'), 'open')

    expect(screen.getByText('1 of 2')).toBeVisible()
  })

  it('says nothing about the count when nothing is filtered out', () => {
    renderWithProviders(<ProvidersPanel providers={[anthropic, openai]} />)

    expect(screen.queryByText('2 of 2')).not.toBeInTheDocument()
  })

  it('tells the filters apart from an empty list', async () => {
    const { user } = renderWithProviders(
      <ProvidersPanel providers={[anthropic]} />,
    )

    await user.type(screen.getByLabelText('Search providers'), 'zzz')

    expect(screen.getByText('No providers match these filters.')).toBeVisible()
  })

  it('says so when there are no providers', () => {
    renderWithProviders(<ProvidersPanel providers={[]} />)

    expect(screen.getByText('No providers yet.')).toBeVisible()
  })

  it('shows each provider’s status', () => {
    renderWithProviders(<ProvidersPanel providers={[anthropic, openai]} />)

    expect(rowFor('ANTHROPIC').getByText('Active')).toBeVisible()
    expect(rowFor('OPEN_AI').getByText('Retired')).toBeVisible()
  })
})
