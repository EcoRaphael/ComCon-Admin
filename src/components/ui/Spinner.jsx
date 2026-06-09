// src/components/ui/Spinner.jsx
// Pure SVG spinner — no CSS border tricks, no transition interference.
// The arc gap is hardcoded in SVG so it's always visible and always rotates.

export default function Spinner({
  size       = 48,
  label      = null,
  fullScreen = false,
  className  = '',
}) {
  const r   = 38          // radius
  const cx  = 50          // center x
  const cy  = 50          // center y
  const circ = 2 * Math.PI * r  // ~238.76

  // Arc covers ~25% of circle, gap covers ~75%
  const arc  = circ * 0.25
  const gap  = circ * 0.75

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Track ring — faint */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke="#2E7D32"
        strokeOpacity="0.15"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Rotating arc — solid, clear gap */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke="#2E7D32"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${arc} ${gap}`}
        strokeDashoffset={arc * 0.25}
        style={{
          transformOrigin: '50px 50px',
          animation: 'svgSpin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes svgSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '16px',
        backgroundColor: 'var(--color-bg-secondary)',
      }}>
        <svg
          width={72} height={72}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <circle cx={cx} cy={cy} r={r}
            stroke="#2E7D32" strokeOpacity="0.15"
            strokeWidth="10" strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={r}
            stroke="#2E7D32" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${gap}`}
            strokeDashoffset={arc * 0.25}
            style={{
              transformOrigin: '50px 50px',
              animation: 'svgSpin 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes svgSpin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </svg>
        {label && (
          <p style={{
            fontSize: '14px', fontWeight: 500,
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}>
            {label}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '10px',
      }}
    >
      {svg}
      {label && (
        <p style={{
          fontSize: '13px', fontWeight: 500,
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}>
          {label}
        </p>
      )}
    </div>
  )
}