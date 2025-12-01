'use client'

interface DataPoint {
  date: string
  best1rm: number
  bestWeight: number
  totalVolume: number
}

interface ExerciseProgressChartProps {
  exerciseName: string
  data: DataPoint[]
}

export default function ExerciseProgressChart({ exerciseName, data }: ExerciseProgressChartProps) {
  // Get the latest and first values for comparison
  const firstEntry = data[0]
  const latestEntry = data[data.length - 1]
  
  const oneRmChange = latestEntry.best1rm - firstEntry.best1rm
  const oneRmPercentChange = firstEntry.best1rm > 0 
    ? ((oneRmChange / firstEntry.best1rm) * 100).toFixed(1) 
    : '0'

  // Find min/max for chart scaling
  const maxValue = Math.max(...data.map(d => d.best1rm))
  const minValue = Math.min(...data.map(d => d.best1rm))
  const range = maxValue - minValue || 1

  // Create SVG path for the line chart
  const chartWidth = 300
  const chartHeight = 80
  const padding = 10

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2)
    const y = chartHeight - padding - ((d.best1rm - minValue) / range) * (chartHeight - padding * 2)
    return { x, y, value: d.best1rm, date: d.date }
  })

  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  // Create area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{exerciseName}</h3>
          <p className="text-sm text-zinc-500">{data.length} sessions</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round(latestEntry.best1rm)}</div>
          <div className="text-xs text-zinc-500">Est. 1RM (lbs)</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-4">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <line 
            x1={padding} 
            y1={chartHeight - padding} 
            x2={chartWidth - padding} 
            y2={chartHeight - padding} 
            stroke="#27272a" 
            strokeWidth="1" 
          />
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />
          
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End point */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill="#f97316"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 ${
            oneRmChange > 0 ? 'text-green-400' :
            oneRmChange < 0 ? 'text-red-400' : 'text-zinc-400'
          }`}>
            {oneRmChange > 0 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : oneRmChange < 0 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : null}
            {oneRmChange > 0 ? '+' : ''}{Math.round(oneRmChange)} lbs
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            parseFloat(oneRmPercentChange) > 0 ? 'bg-green-500/20 text-green-400' :
            parseFloat(oneRmPercentChange) < 0 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {parseFloat(oneRmPercentChange) > 0 ? '+' : ''}{oneRmPercentChange}%
          </span>
        </div>
        <span className="text-zinc-500">
          {new Date(firstEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(latestEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

