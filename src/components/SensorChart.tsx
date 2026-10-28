import type { DriftRound } from '../lib/drift'

export default function SensorChart({ round, elapsed, revealed, pressedAt }: {
  round: DriftRound; elapsed: number; revealed: boolean; pressedAt: number | null
}) {
  const { sensor, samples, duration } = round
  const width = 760
  const height = 300
  const left = 58
  const right = 18
  const top = 24
  const bottom = 38
  const x = (second: number) => left + second / duration * (width - left - right)
  const y = (value: number) => height - bottom - (value - sensor.min) / (sensor.max - sensor.min) * (height - top - bottom)
  const visible = revealed ? samples : samples.filter((sample) => sample.second <= elapsed)
  const points = visible.map((sample) => `${x(sample.second)},${y(sample.value)}`).join(' ')
  const last = visible.at(-1)
  const markers = revealed ? [
    { second: round.onset, label: 'Sustained drift', style: 'onset-marker' },
    { second: round.detectorAt, label: 'Detector', style: 'detector-marker' },
    { second: pressedAt, label: 'You', style: 'player-marker' },
  ] : []
  return <svg className="sensor-chart" viewBox={`0 0 ${width} ${height}`} role="img"
    aria-label={`${sensor.title}, synthetic telemetry. Alert line ${sensor.threshold} ${sensor.unit}, fictional tenant-impact line ${sensor.impact} ${sensor.unit}. ${revealed ? 'Full round and decision markers shown.' : 'Only samples received so far are shown.'}`}>
    {[0, 1, 2, 3, 4].map((tick) => {
      const value = sensor.min + tick / 4 * (sensor.max - sensor.min)
      return <g key={tick}><line className="chart-grid" x1={left} x2={width - right} y1={y(value)} y2={y(value)} /><text className="chart-label" x={left - 10} y={y(value) + 4} textAnchor="end">{Math.round(value * 10) / 10}</text></g>
    })}
    {[0, 6, 12, 18, 24].map((second) => <text key={second} className="chart-label" x={x(second)} y={height - 10} textAnchor="middle">{second}s</text>)}
    <line className="chart-threshold" x1={left} x2={width - right} y1={y(sensor.threshold)} y2={y(sensor.threshold)} />
    <line className="chart-impact" x1={left} x2={width - right} y1={y(sensor.impact)} y2={y(sensor.impact)} />
    {visible.length > 1 && <polygon className="chart-area" points={`${x(0)},${height - bottom} ${points} ${x(last!.second)},${height - bottom}`} />}
    <polyline className="chart-line" points={points} />
    {last && <circle className="chart-head" cx={x(last.second)} cy={y(last.value)} r={5} />}
    {markers.map((marker) => marker.second !== null && <g key={marker.label} className={marker.style}>
      <line x1={x(marker.second)} x2={x(marker.second)} y1={top} y2={height - bottom} />
      <text x={Math.min(width - 80, Math.max(left, x(marker.second) + 5))} y={marker.label === 'You' ? 18 : marker.label === 'Detector' ? 34 : 50}>{marker.label}</text>
    </g>)}
  </svg>
}
