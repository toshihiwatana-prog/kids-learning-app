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

const GRADE_COLORS: Record<number, string> = {
  1: 'text-green-600',
  2: 'text-blue-600',
  3: 'text-violet-600',
  4: 'text-orange-600',
  5: 'text-rose-600',
  6: 'text-red-600',
}

export default function ResultScreen({ result, profile, onReplay, onChangeGrade }: Props) {
  const [globalRank, setGlobalRank] = useState<RankInfo | null>(null)
  const [gradeRanks, setGradeRanks] = useState<Record<number, RankInfo>>({})
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

        // ベストスコアのみ保存（既存あればUPDATE、なければINSERT）
        if (existing) {
          if (result.score > prevBest) {
            const { error: updateError } = await supabase
              .from('scores')
              .update({
                score: newBest,
                correct_count: result.correctCount,
                max_combo: result.maxCombo,
              })
              .eq('user_id', profile.id)
              .eq('grade_challenged', result.gradeChallenge)
            if (updateError) console.error('UPDATE error:', updateError)
          }
        } else {
          const { error: insertError } = await supabase.from('scores').insert({
            user_id: profile.id,
            user_grade: profile.grade,
            grade_challenged: result.gradeChallenge,
            score: newBest,
            correct_count: result.correctCount,
            max_combo: result.maxCombo,
            prefecture: profile.prefecture,
            city: profile.city,
          })
          if (insertError) console.error('INSERT error:', insertError)
        }

        // 他ユーザーのスコア一覧を取得（自分以外）
        const { data: othersScores } = await supabase
          .from('scores')
          .select('user_id, user_grade, score')
          .eq('grade_challenged', result.gradeChallenge)
          .neq('user_id', profile.id)

        const others = othersScores ?? []

        // 全体ランキング
        const globalTotal = others.length + 1
        const globalRankVal = others.filter(s => s.score > result.score).length + 1
        setGlobalRank({ rank: globalRankVal, total: globalTotal })

        // 学年別ランキング（1〜6年生それぞれ）
        const ranks: Record<number, RankInfo> = {}
        for (let g = 1; g <= 6; g++) {
          const gradeOthers = others.filter(s => s.user_grade === g)
          // 自分がその学年なら自分もカウント
          const gradeTotal = gradeOthers.length + (profile.grade === g ? 1 : 0)
          if (gradeTotal === 0) continue // その学年のプレイヤーがいない
          const gradeRankVal = gradeOthers.filter(s => s.score > result.score).length + (profile.grade === g ? 1 : 0)
          ranks[g] = { rank: gradeRankVal, total: gradeTotal }
        }
        setGradeRanks(ranks)

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
        <div className="text-xs text-gray-400 mb-3">（小{result.gradeChallenge}年生の問題・{result.score}点で）</div>
        {saving ? (
          <div className="text-center text-gray-400 py-4">集計中…</div>
        ) : (
          <div className="space-y-2">
            {/* 学年別 */}
            {[1,2,3,4,5,6].map(g => {
              const r = gradeRanks[g]
              if (!r) return null
              const isMyGrade = g === profile.grade
              return (
                <div key={g} className={`flex items-center justify-between py-1 ${isMyGrade ? 'bg-indigo-50 -mx-2 px-2 rounded-xl' : ''}`}>
                  <span className="text-sm text-gray-600">
                    小{g}年生の中で
                    {isMyGrade && <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full">自分</span>}
                  </span>
                  <span className={`font-black ${GRADE_COLORS[g]}`}>
                    {r.rank}位 <span className="text-gray-400 font-normal text-sm">/ {r.total}人</span>
                  </span>
                </div>
              )
            })}
            {/* 仕切り線 */}
            <div className="border-t border-gray-100 pt-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">🌐 全学年で</span>
                {globalRank ? (
                  <span className="font-black text-indigo-600 text-lg">
                    {globalRank.rank}位 <span className="text-gray-400 font-normal text-sm">/ {globalRank.total}人</span>
                  </span>
                ) : <span className="text-gray-400 text-sm">—</span>}
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
