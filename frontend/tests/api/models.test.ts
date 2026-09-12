import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  createModel,
  deactivateModel,
  listModels,
  updateModel,
} from '../../src/api/models'
import { haiku } from '../mocks/handlers'
import { server } from '../mocks/server'

describe('the models api', () => {
  it('lists what the backend returns', async () => {
    const models = await listModels()

    expect(models[0]?.name).toBe('claude-haiku-4-5')
  })

  it('keeps prices as strings, so no rate is rounded by a float', async () => {
    const models = await listModels()

    expect(models[0]?.input_price).toBe('1.000000')
  })

  it('sends every price on create', async () => {
    let sent: unknown
    server.use(
      http.post('/api/models', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(haiku, { status: 201 })
      }),
    )

    await createModel({
      provider_id: 1,
      name: 'opus',
      input_price: '15',
      cached_input_price: '1.5',
      cache_write_price: '18.75',
      output_price: '75',
    })

    expect(sent).toEqual({
      provider_id: 1,
      name: 'opus',
      input_price: '15',
      cached_input_price: '1.5',
      cache_write_price: '18.75',
      output_price: '75',
    })
  })

  it('sends only the changed fields on update', async () => {
    let sent: unknown
    server.use(
      http.patch('/api/models/10', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(haiku)
      }),
    )

    await updateModel(10, { output_price: '9' })

    expect(sent).toEqual({ output_price: '9' })
  })

  it('accepts the empty body a delete returns', async () => {
    await expect(deactivateModel(10)).resolves.toBeUndefined()
  })
})
