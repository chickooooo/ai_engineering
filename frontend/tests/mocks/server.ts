import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Intercepts every request the tests make, so none reach a real backend. */
export const server = setupServer(...handlers)
