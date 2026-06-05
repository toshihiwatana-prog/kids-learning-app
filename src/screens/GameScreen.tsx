import { useState, useEffect, useCallback, useRef } from 'react'
import { generateQuestion } from '../lib/questionGenerator'
import { sounds } from '../lib/sounds'
import type { GameResult } from '../types'

const GAME_DURATION = 60

type ComboBonus = { combo: number; bonus: number }

function calcComboBonus(combo: number): ComboBonus | null {
  if (combo >= 10) return { combo, bonus: 5 }
  if (combo >= 5) return { combo, bonus: 2 }
  if (combo >= 3) return { combo, bonus: 1 }
  return null
}

type Props = {
  grade: number
  onComplete: (result: GameResult) => void
}

export default function GameScreen({ grade, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [question, setQuestion] = useState(() => generateQuestion(grade))
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [comboBanner, setComboBanner] = useState<ComboBonus | null>(null)

  const scoreRef = useRef(score)
  const correctRef = useRef(correctCount)
  const maxComboRef = useRef(maxCombo)
  scoreRef.current = score
  correctRef.current = correctCount
  maxComboRef.current = maxCombo

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          sounds.timeup()
          onComplete({
            score: scoreRef.current,
            correctCount: correctRef.current,
            maxCombo: maxComboRef.current,
            gradeChallenge: grade,
          })
          return 0
        }
        if (t <= 10) sounds.tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [grade, onComplete])

  const submit = useCallback(() => {
    const val = parseInt(input, 10)
    if (isNaN(val) || input.trim() === '') return

    if (val === question.answer) {
      const newCombo = combo + 1
      const bonus = calcComboBonus(newCombo)
      const addScore = 1 + (bonus?.bonus ?? 0)
      setScore(s => s + addScore)
      setCorrectCount(c => c + 1)
      setCombo(newCombo)
      setMaxCombo(m => Math.max(m, newCombo))
      if (bonus) {
        setComboBanner(bonus)
        sounds.combo(newCombo)
      } else {
        sounds.correct()
      }
      setFeedback('correct')
    } else {
      setCombo(0)
      setComboBanner(null)
      sounds.wrong()
      setFeedback('wrong')
    }

    setInput('')
    setQuestion(generateQuestion(grade))
    setTimeout(() => setFeedback(null), 300)
  }, [input, question.answer, combo, grade])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { submit(); return }
      if (e.key === 'Backspace') { setInput(s => s.slice(0, -1)); return }
      if (/^\d$/.test(e.key)) { setInput(s => s.length < 6 ? s + e.key : s) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [submit])

  const pressKey = (key: string) => {
    if (key === 'BS') { setInput(s => s.slice(0, -1)); return }
    if (key === 'OK') { submit(); return }
    if (input.length < 6) setInput(s => s + key)
  }

  const timerColor = timeLeft <= 10 ? 'text-red-500' : timeLeft <= 20 ? 'text-orange-500' : 'text-indigo-700'

  return (
    <div className="flex flex-col min-h-screen max-w-sm mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-6xl font-black ${timerColor} tabular-nums`}>
          {timeLeft}
          <span className="text-2xl font-bold ml-1">秒</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">スコア</div>
          <div className="text-4xl font-black text-indigo-600 tabular-nums">{score}</div>
        </div>
      </div>

      {/* Combo banner */}
      <div className="h-10 mb-2 flex items-center justify-center">
        {comboBanner && combo > 0 && (
          <div className="bg-orange-500 text-white font-black px-4 py-1 rounded-full text-sm animate-bounce">
            🔥 {combo}連続！ボーナス +{comboBanner.bonus}点
          </div>
        )}
      </div>

      {/* Question */}
      <div
        className={`flex-1 flex items-center justify-center rounded-3xl mb-4 transition-colors ${
          feedback === 'correct' ? 'bg-green-100' : feedback === 'wrong' ? 'bg-red-100' : 'bg-white'
        } shadow-lg`}
      >
        {question.vertical ? (
          // 筆算レイアウト
          <div className="inline-grid font-mono font-black text-gray-800"
            style={{ gridTemplateColumns: 'auto 1fr', fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
            {/* 上の数 */}
            <div className="col-span-2 text-right pr-2 tracking-wider">
              {question.vertical.top}
            </div>
            {/* 演算子 + 下の数 */}
            <div className="pr-1 text-gray-500">{question.vertical.operator}</div>
            <div className="text-right pr-2 tracking-wider">
              {question.vertical.bottom}
            </div>
            {/* 横線 */}
            <div className={`col-span-2 border-b-4 my-2 ${
              feedback === 'correct' ? 'border-green-400' :
              feedback === 'wrong' ? 'border-red-400' :
              'border-gray-500'
            }`} />
            {/* 答え入力 */}
            <div className="col-span-2 text-right pr-2">
              <span className={`tracking-wider ${
                feedback === 'correct' ? 'text-green-600' :
                feedback === 'wrong' ? 'text-red-600' :
                'text-indigo-600'
              }`}>
                {input || <span className="opacity-30">?</span>}
              </span>
            </div>
          </div>
        ) : (
          // 横レイアウト（割り算など）
          <div className="text-center">
            <div className="text-5xl font-black text-gray-800 mb-6">{question.expression}</div>
            <div
              className={`inline-block min-w-32 text-5xl font-black text-right px-4 py-2 rounded-2xl border-b-4 ${
                feedback === 'correct' ? 'border-green-400 text-green-600' :
                feedback === 'wrong' ? 'border-red-400 text-red-600' :
                'border-indigo-400 text-indigo-700'
              }`}
            >
              {input || <span className="opacity-30">?</span>}
            </div>
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {['7','8','9','4','5','6','1','2','3'].map(k => (
          <button
            key={k}
            onPointerDown={e => { e.preventDefault(); pressKey(k) }}
            className="bg-white text-gray-800 text-3xl font-black py-5 rounded-2xl shadow active:bg-gray-100 active:scale-95 transition-all select-none"
          >
            {k}
          </button>
        ))}
        <button
          onPointerDown={e => { e.preventDefault(); pressKey('BS') }}
          className="bg-gray-200 text-gray-600 text-2xl font-bold py-5 rounded-2xl shadow active:bg-gray-300 active:scale-95 transition-all select-none"
        >
          ⌫
        </button>
        <button
          onPointerDown={e => { e.preventDefault(); pressKey('0') }}
          className="bg-white text-gray-800 text-3xl font-black py-5 rounded-2xl shadow active:bg-gray-100 active:scale-95 transition-all select-none"
        >
          0
        </button>
        <button
          onPointerDown={e => { e.preventDefault(); pressKey('OK') }}
          className="bg-indigo-600 text-white text-2xl font-black py-5 rounded-2xl shadow-lg active:bg-indigo-700 active:scale-95 transition-all select-none"
        >
          決定
        </button>
      </div>
    </div>
  )
}
