import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { UserProfile, GameResult } from '../types'

type RankInfo = {
  rank: number
  total: number
}

type Props = {
  result: GameResult
  profile: UserProfile
  onReplay: () => void
  onChangeGrade: () => void
}

export default function ResultScreen({ result, profile, onReplay, onChangeGrade }: Props) {
  const [globalRank, setGlobalRank] = useState<RankInfo | null>(null)
  const [gradeRank, setGradeRank] = useState<RankInfo | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [saving, setSaving] = useState(true)
  const savedRef = useRef(false)

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    async function saveAndRank() {
      setSaving(true)
      try {
        // 既存のベストスコアを確認
        const { data: existing } = await supabase
          .from('scores')
          .select('score')
          .eq('user_id', profile.id)
          .eq('grade_challenged', result.gradeChallenge)
          .single()

        const prevBest = existing?.score ?? 0
        const newBest = Math.max(prevBest, result.score)
        setIsNewBest(result.score > prevBest)

        // ベストスコアのみupsert（1人1レコード）
        await supabase.from('scores').upsert({
          user_id: profile.id,
          user_grade: profile.grade,
          grade_challenged: result.gradeChallenge,
          score: newBest,
          correct_count: result.correctCount,
          max_combo: result.maxCombo,
          prefecture: profile.prefecture,
          city: profile.city,
        }, { onConflict: 'user_id,grade_challenged' })

        // 他ユーザーのベストスコア一覧を取得
        const { data: othersScores } = await supabase
          .from('scores')
          .select('user_id, user_grade, score')
          .eq('grade_challenged', result.gradeChallenge)
          .neq('user_id', profile.id)

        const others = othersScores ?? []
        const total = others.length + 1

        // 今回のスコアが他ユーザーのベストと比べて何位か
        const globalRankVal = others.filter(s => s.score > result.score).length + 1
        setGlobalRank({ rank: globalRankVal, total })

        const gradeOthers = others.filter(s => s.user_grade === profile.grade)
        const gradeTotal = gradeOthers.length + 1
        const gradeRankVal = gradeOthers.filter(s => s.score > result.score).length + 1
        setGradeRank({ rank: gradeRankVal, total: gradeTotal })

      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    }
    saveAndRank()
  }, [result, profile])

  return (
    <div className="flex flex-col items-center min-h-screen p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-black text-indigo-700 mt-8 mb-1">結果発表！</h2>
      <p className="text-gray-500 text-sm mb-6">小学{result.gradeChallenge}年生の問題</p>

      {/* Score */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 w-full text-center shadow-xl mb-4">
        {isNewBest && <div className="text-yellow-300 font-black text-sm mb-1">🎉 新記録！</div>}
        <div className="text-white text-sm font-bold mb-1">スコア</div>
        <div className="text-white text-8xl font-black tabular-nums">{result.score}</div>
        <div className="text-indigo-200 text-sm">点</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full mb-4">
        <div className="bg-white rounded-2xl p-4 text-center shadow">
          <div className="text-gray-500 text-xs mb-1">正解数</div>
          <div className="text-3xl font-black text-gray-800">{result.correctCount}</div>
          <div className="text-gray-400 text-xs">問</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow">
          <div className="text-gray-500 text-xs mb-1">最大コンボ</div>
          <div className="text-3xl font-black text-orange-500">{result.maxCombo}</div>
          <div className="text-gray-400 text-xs">連続</div>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-2xl p-5 w-full shadow mb-6">
        <div className="font-black text-gray-700 mb-1">今回のランキング</div>
        <div className="text-xs text-gray-400 mb-3">（小{result.gradeChallenge}年生の問題・今回の{result.score}点で）</div>
        {saving ? (
          <div className="text-center text-gray-400 py-4">集計中…</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🌐 全体</span>
              {globalRank ? (
                <span className="font-black text-indigo-600">
                  {globalRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {globalRank.total}人</span>
                </span>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">📚 小{profile.grade}年生の中で</span>
              {gradeRank ? (
                <span className="font-black text-purple-600">
                  {gradeRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {gradeRank.total}人</span>
                </span>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={onReplay}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          🔁 もう一回！
        </button>
        <button
          onClick={onChangeGrade}
          className="w-full bg-white hover:bg-gray-50 text-indigo-600 text-lg font-bold py-4 rounded-2xl shadow border-2 border-indigo-200 active:scale-95 transition-all"
        >
          他の学年に挑戦
        </button>
      </div>
    </div>
  )
}
