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
  const [currentRank, setCurrentRank] = useState<RankInfo | null>(null)   // 今回のスコアの順位
  const [bestRank, setBestRank] = useState<RankInfo | null>(null)          // ベストスコアの順位
  const [bestScore, setBestScore] = useState<number>(result.score)         // 自分のベストスコア
  const [currentGradeRank, setCurrentGradeRank] = useState<RankInfo | null>(null)
  const [bestGradeRank, setBestGradeRank] = useState<RankInfo | null>(null)
  const [saving, setSaving] = useState(true)
  const savedRef = useRef(false)

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    async function saveAndRank() {
      setSaving(true)
      try {
        // 既存のベストスコアを取得
        const { data: existing } = await supabase
          .from('scores')
          .select('score')
          .eq('user_id', profile.id)
          .eq('grade_challenged', result.gradeChallenge)
          .single()

        const prevBest = existing?.score ?? 0
        const newBest = Math.max(prevBest, result.score)
        setBestScore(newBest)

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

        // 全ユーザーのベストスコア一覧を取得（自分を除く）
        const { data: othersScores } = await supabase
          .from('scores')
          .select('user_id, user_grade, score')
          .eq('grade_challenged', result.gradeChallenge)
          .neq('user_id', profile.id)

        const others = othersScores ?? []

        // ---- 全体ランキング ----
        // 今回のスコアが何位か
        const currentGlobalRank = others.filter(s => s.score > result.score).length + 1
        setCurrentRank({ rank: currentGlobalRank, total: others.length + 1 })

        // ベストスコアが何位か
        const bestGlobalRank = others.filter(s => s.score > newBest).length + 1
        setBestRank({ rank: bestGlobalRank, total: others.length + 1 })

        // ---- 学年内ランキング ----
        const gradeOthers = others.filter(s => s.user_grade === profile.grade)

        const currentGradeRankVal = gradeOthers.filter(s => s.score > result.score).length + 1
        setCurrentGradeRank({ rank: currentGradeRankVal, total: gradeOthers.length + 1 })

        const bestGradeRankVal = gradeOthers.filter(s => s.score > newBest).length + 1
        setBestGradeRank({ rank: bestGradeRankVal, total: gradeOthers.length + 1 })

      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    }
    saveAndRank()
  }, [result, profile])

  const isNewBest = result.score >= bestScore

  return (
    <div className="flex flex-col items-center min-h-screen p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-black text-indigo-700 mt-8 mb-1">結果発表！</h2>
      <p className="text-gray-500 text-sm mb-6">小学{result.gradeChallenge}年生の問題</p>

      {/* Score */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 w-full text-center shadow-xl mb-4">
        {isNewBest && <div className="text-yellow-300 font-black text-sm mb-1">🎉 新記録！</div>}
        <div className="text-white text-sm font-bold mb-1">今回のスコア</div>
        <div className="text-white text-8xl font-black tabular-nums">{result.score}</div>
        <div className="text-indigo-200 text-sm">点</div>
        {!isNewBest && (
          <div className="text-indigo-200 text-sm mt-2">ベスト: {bestScore}点</div>
        )}
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
        <div className="font-black text-gray-700 mb-3">ランキング（小{result.gradeChallenge}年生の問題）</div>
        {saving ? (
          <div className="text-center text-gray-400 py-4">集計中…</div>
        ) : (
          <div className="space-y-4">
            {/* 今回のスコア */}
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">🎯 今回（{result.score}点）</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">🌐 全体</span>
                {currentRank && (
                  <span className="font-black text-indigo-600">
                    {currentRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {currentRank.total}人</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">📚 小{profile.grade}年生の中で</span>
                {currentGradeRank && (
                  <span className="font-black text-purple-600">
                    {currentGradeRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {currentGradeRank.total}人</span>
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* ベストスコア */}
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">🏆 ベスト（{bestScore}点）</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">🌐 全体</span>
                {bestRank && (
                  <span className="font-black text-indigo-600">
                    {bestRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {bestRank.total}人</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">📚 小{profile.grade}年生の中で</span>
                {bestGradeRank && (
                  <span className="font-black text-purple-600">
                    {bestGradeRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {bestGradeRank.total}人</span>
                  </span>
                )}
              </div>
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
