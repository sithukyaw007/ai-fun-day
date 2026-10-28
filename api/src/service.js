import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

const variants = {
  beat: ['ahu', 'transfer', 'bids', 'leases'],
  drift: ['chiller', 'co2'],
  quiz: ['eight-questions'],
  singlish: ['aircon', 'room', 'rent', 'power', 'solar', 'bid', 'tenants', 'lift'],
}
const maximums = { beat: 100, drift: 1000, quiz: 8, singlish: 1 }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const digest = (token) => createHash('sha256').update(token).digest('hex')

export function nickname(raw) {
  if (typeof raw !== 'string') throw new RequestError(400, 'Enter a nickname.')
  const value = raw.normalize('NFC').replace(/\s+/g, ' ').trim()
  if (!value || [...value].length > 20 || !/^[\p{L}\p{M}\p{N} _.'-]+$/u.test(value)) {
    throw new RequestError(400, 'Use a nickname of 1-20 letters, numbers, spaces or . _ apostrophe hyphen.')
  }
  return value
}

export function validateScore(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new RequestError(400, 'Invalid score.')
  const { id, game, variant, score, maxScore, perfect, elapsedMs } = input
  if (Object.keys(input).some((key) => !['id', 'game', 'variant', 'score', 'maxScore', 'perfect', 'elapsedMs'].includes(key))
    || typeof id !== 'string' || !uuid.test(id)
    || typeof game !== 'string' || !Object.hasOwn(variants, game) || !variants[game].includes(variant) || maxScore !== maximums[game]
    || !Number.isInteger(score) || score < 0 || score > maxScore || typeof perfect !== 'boolean'
    || (elapsedMs !== undefined && (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 86_400_000))
    || (game !== 'singlish' && elapsedMs === undefined)
    || (game === 'beat' && perfect && (score !== 100 || elapsedMs >= 60_000))
    || (['quiz', 'singlish'].includes(game) && perfect !== (score === maxScore))
    || (game === 'drift' && perfect && score < 200)) {
    throw new RequestError(400, 'Invalid game, score or elapsed time.')
  }
  return { id, game, variant, score, maxScore, perfect, ...(elapsedMs === undefined ? {} : { elapsedMs }) }
}

export function compare(a, b) {
  return Number(b.perfect) - Number(a.perfect) || b.score / b.maxScore - a.score / a.maxScore
    || (a.elapsedMs ?? Infinity) - (b.elapsedMs ?? Infinity) || a.playedAt - b.playedAt
}

function publicScore(entity) {
  const { id, game, variant, score, maxScore, perfect, playedAt, playerId, nickname: name, elapsedMs } = entity
  return { id, game, variant, score, maxScore, perfect, playedAt, playerId, nickname: name, player: 'Player 000',
    ...(elapsedMs === undefined ? {} : { elapsedMs }) }
}

export function createService(store, { event = 'jtc-ai-2026', now = Date.now } = {}) {
  const players = `${event}|players`
  const boardPrefix = `${event}|board|`
  return {
    async join(input) {
      if (!input || Object.keys(input).length !== 1) throw new RequestError(400, 'Provide a nickname only.')
      const name = nickname(input.nickname)
      const id = randomUUID()
      const token = randomBytes(32).toString('base64url')
      await store.create({ partitionKey: players, rowKey: id, nickname: name, tokenHash: digest(token), expiresAt: now() + 86_400_000 })
      return { profile: { id, nickname: name }, token: `${id}.${token}` }
    },
    async submit(input, authorization) {
      const score = validateScore(input)
      const match = typeof authorization === 'string' && authorization.match(/^Bearer ([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/i)
      if (!match) throw new RequestError(401, 'Check in again to publish scores.')
      const player = await store.get(players, match[1])
      if (!player || player.expiresAt <= now()
        || !timingSafeEqual(Buffer.from(player.tokenHash, 'hex'), Buffer.from(digest(match[2]), 'hex'))) {
        throw new RequestError(401, 'Your player session expired. Check in again.')
      }
      const entity = { ...score, nickname: player.nickname, playerId: match[1], playedAt: now(),
        partitionKey: `${boardPrefix}${score.game}|${score.variant}`, rowKey: match[1] }
      // Conditional writes prevent simultaneous submissions from overwriting a better result.
      for (let attempt = 0; attempt < 8; attempt++) {
        const previous = await store.get(entity.partitionKey, entity.rowKey)
        if (previous && compare(entity, previous) >= 0) return { result: publicScore(previous) }
        try {
          if (previous) await store.replace(entity, previous.etag)
          else await store.create(entity)
          return { result: publicScore(entity) }
        } catch (error) {
          if (![409, 412].includes(error.statusCode)) throw error
        }
      }
      throw new RequestError(409, 'Another score is updating. Retry this submission.')
    },
    async list() {
      const groups = new Map()
      const players = new Set()
      for await (const entity of store.list(boardPrefix)) {
        if (entity.playedAt < now() - 7 * 86_400_000) continue
        const key = `${entity.game}|${entity.variant}`
        const group = groups.get(key) ?? []
        group.push(publicScore(entity))
        group.sort(compare)
        groups.set(key, group.slice(0, 10))
        players.add(entity.playerId)
      }
      return { results: [...groups.values()].flat(), totalPlayers: players.size, refreshedAt: now() }
    },
  }
}
