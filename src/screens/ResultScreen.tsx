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
  const [saving, setSaving] = useState(true)
  const savedRef = useRef(false)

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    async function saveAndRank() {
      setSaving(true)
      try {
        // 全プレイ履歴をINSERT（ベストスコア管理はランキング集計時に行う）
        await supabase.from('scores').insert({
          user_id: profile.id,
          user_grade: profile.grade,
          grade_challenged: result.gradeChallenge,
          score: result.score,
          correct_count: result.correctCount,
          max_combo: result.maxCombo,
          prefecture: profile.prefecture,
          city: profile.city,
        })

        // 全スコアを取得してユーザーごとのベストスコアに集約してからランキング計算
        const { data: allScores } = await supabase
          .from('scores')
          .select('user_id, user_grade, score')
          .eq('grade_challenged', result.gradeChallenge)

        if (allScores) {
          // ユーザーごとにベストスコアだけ残す
          const bestMap = new Map<string, { user_id: string; user_grade: number; score: number }>()
          for (const s of allScores) {
            const current = bestMap.get(s.user_id)
            if (!current || s.score > current.score) {
              bestMap.set(s.user_id, s)
            }
          }
          // スコア降順でソート → これがランキング順
          const bestList = [...bestMap.values()].sort((a, b) => b.score - a.score)

          // 全体ランキング
          const globalTotal = bestList.length
          const globalRankIdx = bestList.findIndex(s => s.user_id === profile.id)
          if (globalRankIdx >= 0) setGlobalRank({ rank: globalRankIdx + 1, total: globalTotal })

          // 自分の学年内ランキング
          const gradeList = bestList.filter(s => s.user_grade === profile.grade)
          const gradeTotal = gradeList.length
          const gradeRankIdx = gradeList.findIndex(s => s.user_id === profile.id)
          if (gradeRankIdx >= 0) setGradeRank({ rank: gradeRankIdx + 1, total: gradeTotal })
        }
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
        <div className="font-black text-gray-700 mb-3">ランキング（小{result.gradeChallenge}年生の問題）</div>
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
