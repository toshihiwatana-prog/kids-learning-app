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
  gradeRank: number
  gradeTotal: number
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
  const [rankMode, setRankMode] = useState<'grade' | 'global'>('grade')

  useEffect(() => {
    async function fetchStats() {
      const { data: myScores } = await supabase
        .from('scores')
        .select('grade_challenged, score')
        .eq('user_id', profile.id)

      if (!myScores || myScores.length === 0) return

      const newStats: Record<number, GradeStat> = {}

      for (const my of myScores) {
        const g = my.grade_challenged

        // 全体：自分より高いスコアの人数
        const { count: globalAbove } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)
          .gt('score', my.score)

        // 全体：総人数
        const { count: globalTotal } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)

        // 学年内：自分より高いスコアの人数
        const { count: gradeAbove } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)
          .eq('user_grade', profile.grade)
          .gt('score', my.score)

        // 学年内：総人数
        const { count: gradeTotal } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)
          .eq('user_grade', profile.grade)

        newStats[g] = {
          bestScore: my.score,
          globalRank: (globalAbove ?? 0) + 1,
          globalTotal: globalTotal ?? 1,
          gradeRank: (gradeAbove ?? 0) + 1,
          gradeTotal: gradeTotal ?? 1,
        }
      }

      setStats(newStats)
    }

    fetchStats()
  }, [profile.id, profile.grade])

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <h2 className="text-3xl font-black text-indigo-700 mt-10 mb-1">学年を選ぼう</h2>
      <p className="text-gray-500 text-sm mb-4">どの学年の問題に挑戦する？</p>

      {/* ランク切り替えトグル */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setRankMode('grade')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            rankMode === 'grade'
              ? 'bg-white text-indigo-600 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          小{profile.grade}年生の中で
        </button>
        <button
          onClick={() => setRankMode('global')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            rankMode === 'global'
              ? 'bg-white text-indigo-600 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🌐 全体
        </button>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {[1,2,3,4,5,6].map(g => {
          const stat = stats[g]
          const rank = stat ? (rankMode === 'grade' ? stat.gradeRank : stat.globalRank) : null
          const total = stat ? (rankMode === 'grade' ? stat.gradeTotal : stat.globalTotal) : null
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
                      <div className="text-xs opacity-80">{rank}位/{total}人</div>
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
