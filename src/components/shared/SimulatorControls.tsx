interface SimulatorControlsProps {
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
  isPlaying: boolean
  currentStep: number
  totalSteps: number
  message?: string
}

export default function SimulatorControls({
  onPrev,
  onNext,
  onTogglePlay,
  isPlaying,
  currentStep,
  totalSteps,
  message,
}: SimulatorControlsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="controls" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="control-btn"
          onClick={onPrev}
          disabled={currentStep <= 0 || isPlaying}
        >
          ◀ 이전 단계
        </button>

        <button
          className="control-btn"
          onClick={onTogglePlay}
          style={{ background: isPlaying ? '#e53935' : '#667eea' }}
        >
          {isPlaying ? '⏸ 일시 정지' : '▶ 자동 재생'}
        </button>

        <button
          className="control-btn"
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1 || isPlaying}
        >
          다음 단계 ▶
        </button>

        <span style={{ fontSize: '0.9rem', color: '#555', marginLeft: '0.5rem' }}>
          {currentStep + 1} / 전체 {totalSteps}단계
        </span>
      </div>

      {message && (
        <div style={{
          background: '#f0f4ff',
          border: '1px solid #c5cae9',
          borderRadius: 6,
          padding: '0.6rem 1rem',
          fontSize: '0.9rem',
          color: '#3949ab',
        }}>
          💬 {message}
        </div>
      )}
    </div>
  )
}
