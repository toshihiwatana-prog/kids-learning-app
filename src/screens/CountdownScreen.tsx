import { useState, useEffect } from 'react'
import { sounds } from '../lib/sounds'

type Props = {
  onComplete: () => void
}

export default function CountdownScreen({ onComplete }: Props) {
  const [count, setCount] = useState<number | 'GO!'>(3)

  useEffect(() => {
    sounds.countdown() // 最初の「3」
    const steps = [3, 2, 1, 'GO!'] as const
    let i = 0
    const id = setInterval(() => {
      i++
      if (i < steps.length) {
        setCount(steps[i])
        if (steps[i] === 'GO!') sounds.go()
        else sounds.countdown()
      } else {
        clearInterval(id)
        onComplete()
      }
    }, 800)
    return () => clearInterval(id)
  }, [onComplete])

  const isGo = count === 'GO!'

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        key={String(count)}
        className={`text-center animate-ping-once ${isGo ? 'text-green-500' : 'text-indigo-600'}`}
        style={{ animation: 'scaleIn 0.3s ease-out' }}
      >
        <div className="text-9xl font-black" style={{ fontSize: isGo ? '6rem' : '10rem' }}>
          {count}
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
