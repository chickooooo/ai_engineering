import { screen } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { ModelsPanel } from '../../../src/features/llm/ModelsPanel'
import { anthropic, haiku, openai } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import { rowFor } from '../../rows'
import { renderWithProviders } from '../../utils'

const PROVIDERS = [anthropic, openai]

describe('<ModelsPanel />', () => {
  it('shows each model under its provider', () => {
    renderWithProviders(<ModelsPanel models={[haiku]} providers={PROVIDERS} />)

    expect(rowFor('claude-haiku-4-5').getByText('ANTHROPIC')).toBeVisible()
  })

  it('trims the trailing zeros off a price', () => {
    renderWithProviders(<ModelsPanel models={[haiku]} providers={PROVIDERS} />)

    const row = rowFor('claude-haiku-4-5')

    expect(row.getByText('1')).toBeVisible()
    expect(row.getByText('0.1')).toBeVisible()
    expect(row.getByText('1.25')).toBeVisible()
    expect(row.getByText('5')).toBeVisible()
  })

  it('sends every field when a model is added', async () => {
    let sent: unknown
    server.use(
      http.post('/api/models', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(haiku, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(
      <ModelsPanel models={[]} providers={PROVIDERS} />,
    )
    await user.click(screen.getByRole('button', { name: /New model/ }))
    await user.type(screen.getByLabelText('Name'), 'opus')
    await user.clear(screen.getByLabelText('Input price'))
    await user.type(screen.getByLabelText('Input price'), '15')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(sent).toEqual({
      provider_id: 1,
      name: 'opus',
      input_price: '15',
      cached_input_price: '0',
      cache_write_price: '0',
      output_price: '0',
    })
  })

  it('lets the provider be chosen when adding', async () => {
    let sent: unknown
    server.use(
      http.post('/api/models', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(haiku, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(
      <ModelsPanel models={[]} providers={PROVIDERS} />,
    )
    await user.click(screen.getByRole('button', { name: /New model/ }))
    await user.selectOptions(screen.getByLabelText('Provider'), '2')
    await user.type(screen.getByLabelText('Name'), 'gpt-5-nano')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(sent).toMatchObject({ provider_id: 2 })
  })

  it('opens the edit form with the current prices', async () => {
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku]} providers={PROVIDERS} />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText('Name')).toHaveValue('claude-haiku-4-5')
    expect(screen.getByLabelText('Output price')).toHaveValue(5)
  })

  it('saves an edited model as a patch', async () => {
    let sent: unknown
    server.use(
      http.patch('/api/models/10', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(haiku)
      }),
    )

    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku]} providers={PROVIDERS} />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Output price'))
    await user.type(screen.getByLabelText('Output price'), '9')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(sent).toMatchObject({ output_price: '9' })
  })

  it('closes the edit form on cancel', async () => {
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku]} providers={PROVIDERS} />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not offer to move a model between providers', async () => {
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku]} providers={PROVIDERS} />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.queryByLabelText('Provider')).not.toBeInTheDocument()
  })

  it('retires an active model', async () => {
    let called = false
    server.use(
      http.delete('/api/models/10', () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku]} providers={PROVIDERS} />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Retire claude-haiku-4-5' }),
    )

    expect(called).toBe(true)
  })

  it('offers to restore a retired model instead', async () => {
    let sent: unknown
    server.use(
      http.patch('/api/models/10', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(haiku)
      }),
    )

    const retired = { ...haiku, is_active: false }
    const { user } = renderWithProviders(
      <ModelsPanel models={[retired]} providers={PROVIDERS} />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Restore claude-haiku-4-5' }),
    )

    expect(sent).toEqual({ is_active: true })
  })

  it('shows a dash when the provider is unknown', () => {
    renderWithProviders(<ModelsPanel models={[haiku]} providers={[]} />)

    expect(rowFor('claude-haiku-4-5').getByText('—')).toBeVisible()
  })

  it('shows the conflict the backend reports', async () => {
    server.use(
      http.post('/api/models', () =>
        HttpResponse.json(
          { detail: 'That provider already has a model named' },
          { status: 409 },
        ),
      ),
    )

    const { user } = renderWithProviders(
      <ModelsPanel models={[]} providers={PROVIDERS} />,
    )
    await user.click(screen.getByRole('button', { name: /New model/ }))
    await user.type(screen.getByLabelText('Name'), 'claude-haiku-4-5')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /already has a model named/,
    )
  })

  it('disables the save button while the request is in flight', async () => {
    server.use(
      http.post('/api/models', async () => {
        await delay(50)
        return HttpResponse.json(haiku, { status: 201 })
      }),
    )

    const { user } = renderWithProviders(
      <ModelsPanel models={[]} providers={PROVIDERS} />,
    )
    await user.click(screen.getByRole('button', { name: /New model/ }))
    await user.type(screen.getByLabelText('Name'), 'opus')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled()
  })

  it('narrows the list by name', async () => {
    const other = { ...haiku, id: 11, name: 'gpt-5-nano', provider_id: 2 }
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku, other]} providers={PROVIDERS} />,
    )

    await user.type(screen.getByLabelText('Search models'), 'haiku')

    expect(screen.getByText('claude-haiku-4-5')).toBeVisible()
    expect(screen.queryByText('gpt-5-nano')).not.toBeInTheDocument()
  })

  it('narrows the list by provider', async () => {
    const other = { ...haiku, id: 11, name: 'gpt-5-nano', provider_id: 2 }
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku, other]} providers={PROVIDERS} />,
    )

    await user.selectOptions(
      screen.getByLabelText('Filter models by provider'),
      '2',
    )

    expect(screen.getByText('gpt-5-nano')).toBeVisible()
    expect(screen.queryByText('claude-haiku-4-5')).not.toBeInTheDocument()
  })

  it('narrows the list by status', async () => {
    const retired = { ...haiku, id: 11, name: 'gpt-5-nano', is_active: false }
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku, retired]} providers={PROVIDERS} />,
    )

    await user.selectOptions(
      screen.getByLabelText('Filter models by status'),
      'retired',
    )

    expect(screen.getByText('gpt-5-nano')).toBeVisible()
    expect(screen.queryByText('claude-haiku-4-5')).not.toBeInTheDocument()
  })

  it('tells the filters apart from an empty list', async () => {
    const { user } = renderWithProviders(
      <ModelsPanel models={[haiku]} providers={PROVIDERS} />,
    )

    await user.type(screen.getByLabelText('Search models'), 'zzz')

    expect(screen.getByText('No models match these filters.')).toBeVisible()
  })

  it('says so when there are no models', () => {
    renderWithProviders(<ModelsPanel models={[]} providers={PROVIDERS} />)

    expect(screen.getByText('No models yet.')).toBeVisible()
  })
})
