export type SensorId = 'chiller' | 'co2'

export interface Sensor {
  id: SensorId
  title: string
  unit: string
  baseline: number
  threshold: number
  impact: number
  min: number
  max: number
  step: number
  description: string
}

export interface SensorSample {
  second: number
  value: number
}

export interface DriftRound {
  sensor: Sensor
  samples: SensorSample[]
  onset: number | null
  impactAt: number | null
  detectorAt: number | null
  duration: number
}

export const sensors: Sensor[] = [
  {
    id: 'chiller', title: 'CH-2 chiller approach temperature', unit: 'C',
    baseline: 3.2, threshold: 4.5, impact: 6.0, min: 2.5, max: 7.5, step: 0.27,
    description: 'A rising approach temperature can be a clue to investigate. Watch for a sustained change, not one blip.',
  },
  {
    id: 'co2', title: 'Meeting Room 7 CO2', unit: 'ppm',
    baseline: 650, threshold: 1000, impact: 1400, min: 400, max: 1800, step: 75,
    description: 'A busy room is getting stuffy. Can you spot the sustained rise before our fictional tenant-impact line?',
  },
]

function randomGenerator(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function detectDrift(samples: SensorSample[], threshold: number): number | null {
  let consecutive = 0
  for (const sample of samples) {
    consecutive = sample.value >= threshold ? consecutive + 1 : 0
    if (consecutive >= 3) return sample.second
  }
  return null
}

export function makeDriftRound(sensor: Sensor, seed: number, noFault = seed % 4 === 0): DriftRound {
  const random = randomGenerator(seed)
  const start = 7 + Math.floor(random() * 5)
  const duration = 24
  const samples = Array.from({ length: duration + 1 }, (_, second) => {
    const noise = (random() - 0.5) * sensor.step * 0.75
    const drift = !noFault && second >= start ? (second - start + 1) * sensor.step : 0
    const harmlessSpike = second === 4 ? sensor.threshold - sensor.baseline + sensor.step : 0
    return {
      second,
      value: Math.round((sensor.baseline + drift + noise + harmlessSpike) * 10) / 10,
    }
  })
  const onset = noFault ? null : samples.find((sample) => sample.second >= start && sample.value >= sensor.threshold)?.second ?? null
  const impactAt = noFault ? null : samples.find((sample) => sample.second >= start && sample.value >= sensor.impact)?.second ?? null
  return { sensor, samples, onset, impactAt, detectorAt: detectDrift(samples, sensor.threshold), duration }
}

export function scoreDrift(round: DriftRound, pressedAt: number | null) {
  if (pressedAt === null) {
    return round.onset === null
      ? { score: 1000, outcome: 'all-clear' as const, title: 'Steady nerves. Correct all-clear.', perfect: true }
      : { score: 0, outcome: 'missed' as const, title: 'The drift got away this time.', perfect: false }
  }
  if (round.onset === null || pressedAt < round.onset) {
    return { score: 0, outcome: 'false-alarm' as const, title: 'That was a blip, not a drift.', perfect: false }
  }
  if (round.impactAt !== null && pressedAt >= round.impactAt) {
    return { score: 100, outcome: 'late' as const, title: 'Spotted it, but the tenant called first.', perfect: false }
  }
  return {
    score: Math.max(200, 1000 - Math.round((pressedAt - round.onset) * 100)),
    outcome: 'caught' as const,
    title: round.detectorAt !== null && pressedAt < round.detectorAt
      ? 'You beat the simulated detector!' : 'Caught before the tenant-impact line.',
    perfect: true,
  }
}
