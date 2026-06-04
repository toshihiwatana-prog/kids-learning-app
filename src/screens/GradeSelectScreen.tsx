import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

type Props = {
  profile: UserProfile
  onSelect: (grade: number) => void
}

type GradeStat = {
  bestScore: number
  globalRank: number
  globalTotal: number
}

const GRADE_LABELS: Record<number, string> = {
  1: 'たし算・ひき算（〜20）',
  2: 'たし算・ひき算・九九',
  3: '四則演算（3桁まで）',
  4: '四則演算・小数の足し引き',
  5: '四則演算・小数のかけ割り',
  6: '小数混合・単位変換',
}

const GRADE_COLORS: Record<number, string> = {
  1: 'from-green-400 to-emerald-500',
  2: 'from-blue-400 to-cyan-500',
  3: 'from-violet-400 to-purple-500',
  4: 'from-orange-400 to-amber-500',
  5: 'from-rose-400 to-pink-500',
  6: 'from-red-500 to-rose-600',
}

export default function GradeSelectScreen({ profile, onSelect }: Props) {
  const [stats, setStats] = useState<Record<number, GradeStat>>({})

  useEffect(() => {
    async function fetchStats() {
      // 自分のベストスコアを全学年分取得
      const { data: myScores } = await supabase
        .from('scores')
        .select('grade_challenged, score')
        .eq('user_id', profile.id)

      if (!myScores || myScores.length === 0) return

      const newStats: Record<number, GradeStat> = {}

      for (const my of myScores) {
        const g = my.grade_challenged
        // その学年問題で自分より高いスコアの人数を取得
        const { count } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)
          .gt('score', my.score)

        const { count: total } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)

        newStats[g] = {
          bestScore: my.score,
          globalRank: (count ?? 0) + 1,
          globalTotal: total ?? 1,
        }
      }

      setStats(newStats)
    }

    fetchStats()
  }, [profile.id])

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <h2 className="text-3xl font-black text-indigo-700 mt-10 mb-1">学年を選ぼう</h2>
      <p className="text-gray-500 text-sm mb-8">どの学年の問題に挑戦する？</p>

      <div className="w-full max-w-sm space-y-3">
        {[1,2,3,4,5,6].map(g => {
          const stat = stats[g]
          return (
            <button
              key={g}
              onClick={() => onSelect(g)}
              className={`w-full bg-gradient-to-r ${GRADE_COLORS[g]} text-white rounded-2xl px-5 py-4 shadow-md active:scale-95 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl">小学{g}年生</span>
                    {g === profile.grade && (
                      <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">自分の学年</span>
                    )}
                  </div>
                  <div className="text-sm opacity-90">{GRADE_LABELS[g]}</div>
                </div>
                <div className="text-right">
                  {stat ? (
                    <div>
                      <div className="font-black text-lg">{stat.bestScore}点</div>
                      <div className="text-xs opacity-80">全体{stat.globalRank}位/{stat.globalTotal}人</div>
                    </div>
                  ) : (
                    <div className="text-sm opacity-70">未挑戦</div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
