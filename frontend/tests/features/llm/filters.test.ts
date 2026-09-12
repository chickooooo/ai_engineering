import { describe, expect, it } from 'vitest'
import { matchesSearch, matchesStatus } from '../../../src/features/llm/filters'

describe('matchesSearch', () => {
  it('matches anywhere in the name', () => {
    expect(matchesSearch('claude-haiku-4-5', 'haiku')).toBe(true)
  })

  it('ignores case on both sides', () => {
    expect(matchesSearch('ANTHROPIC', 'anth')).toBe(true)
  })

  it('ignores surrounding whitespace in the search', () => {
    expect(matchesSearch('gpt-5-nano', '  nano ')).toBe(true)
  })

  it('matches everything when the search is empty', () => {
    expect(matchesSearch('anything', '')).toBe(true)
  })

  it('rejects a name that does not contain the search', () => {
    expect(matchesSearch('gemini-2.5-flash', 'claude')).toBe(false)
  })
})

describe('matchesStatus', () => {
  it('lets everything through on all', () => {
    expect(matchesStatus(true, 'all')).toBe(true)
    expect(matchesStatus(false, 'all')).toBe(true)
  })

  it('keeps only the active ones on active', () => {
    expect(matchesStatus(true, 'active')).toBe(true)
    expect(matchesStatus(false, 'active')).toBe(false)
  })

  it('keeps only the retired ones on retired', () => {
    expect(matchesStatus(false, 'retired')).toBe(true)
    expect(matchesStatus(true, 'retired')).toBe(false)
  })
})
