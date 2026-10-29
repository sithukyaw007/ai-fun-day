import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createService, validateScore } from '../src/service.js'

function memoryStore() {
  const entities = new Map()
  let version = 0
  return {
    async create(entity) {
      const key = entity.partitionKey + '/' + entity.rowKey
      if (entities.has(key)) throw Object.assign(new Error('Conflict'), { statusCode: 409 })
      entities.set(key, { ...entity, etag: String(++version) })
    },
    async replace(entity, etag) {
      const key = entity.partitionKey + '/' + entity.rowKey
      if (entities.get(key)?.etag !== etag) throw Object.assign(new Error('Race'), { statusCode: 412 })
      entities.set(key, { ...entity, etag: String(++version) })
    },
    async get(partition, row) { return entities.get(partition + '/' + row) ?? null },
    async *list(prefix) { for (const entity of entities.values()) if (entity.partitionKey.startsWith(prefix)) yield entity },
  }
}
const score = (value) => ({ id: randomUUID(), game: 'quiz', variant: 'eight-questions', score: value, maxScore: 8, perfect: value === 8, elapsedMs: 2000 })

test('independent player sessions share a public board, not credentials', async () => {
  const service = createService(memoryStore())
  const a = await service.join({ nickname: 'ByteBuddy' })
  const b = await service.join({ nickname: 'ByteBuddy' })
  assert.notEqual(a.profile.id, b.profile.id)
  await Promise.all([service.submit(score(8), 'Bearer ' + a.token), service.submit(score(7), 'Bearer ' + b.token)])
  const board = await service.list()
  assert.equal(board.results.length, 2)
  assert.equal(board.results[0].score, 8)
  assert.ok(!JSON.stringify(board).includes(a.token))
  assert.ok(!JSON.stringify(board).includes('tokenHash'))
})
test('concurrent results and retries cannot overwrite a higher score', async () => {
  const service = createService(memoryStore())
  const player = await service.join({ nickname: 'ChillerChamp' })
  const attempts = [score(2), score(8), score(5)]
  await Promise.all(attempts.map((input) => service.submit(input, 'Bearer ' + player.token)))
  await service.submit(attempts[0], 'Bearer ' + player.token)
  const board = await service.list()
  assert.equal(board.results.length, 1)
  assert.equal(board.results[0].score, 8)
})
test('identities, maxima, variants and expired tokens cannot be forged', async () => {
  let now = 1000
  const service = createService(memoryStore(), { now: () => now })
  const player = await service.join({ nickname: 'A' })
  await assert.rejects(service.submit(score(8), 'Bearer fake'), { status: 401 })
  for (const invalid of [{ ...score(8), playerId: randomUUID() }, { ...score(8), maxScore: 100 }, { ...score(8), variant: 'fake' }]) {
    assert.throws(() => validateScore(invalid), { status: 400 })
  }
  now += 86_400_001
  await assert.rejects(service.submit(score(8), 'Bearer ' + player.token), { status: 401 })
})

test('Beat accepts complete results after a minute or a day without a scoring deadline', async () => {
  const service = createService(memoryStore())
  const player = await service.join({ nickname: 'TakeYourTime' })
  for (const elapsedMs of [60_000, 125_000, 172_800_000]) {
    const input = { id: randomUUID(), game: 'beat', variant: 'ahu', score: 100, maxScore: 100, perfect: true, elapsedMs }
    assert.deepEqual(validateScore(input), input)
  }
  const long = { id: randomUUID(), game: 'beat', variant: 'ahu', score: 100, maxScore: 100, perfect: true, elapsedMs: 125_000 }
  await service.submit(long, 'Bearer ' + player.token)
  const board = await service.list()
  assert.equal(board.results[0].perfect, true)
  assert.equal(board.results[0].elapsedMs, 125_000)
  for (const elapsedMs of [-1, Infinity, NaN]) assert.throws(() => validateScore({ ...long, elapsedMs }), { status: 400 })
  assert.throws(() => validateScore({ ...long, score: 99 }), { status: 400 })
  assert.throws(() => validateScore({ ...score(8), elapsedMs: 172_800_000 }), { status: 400 })
})
