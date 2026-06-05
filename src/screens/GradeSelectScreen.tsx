import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MUNICIPALITIES } from '../lib/municipalities'
import type { UserProfile } from '../types'

type Props = {
  profile: UserProfile
  onProfileUpdate: (profile: UserProfile) => void
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

const PREFECTURES = Object.keys(MUNICIPALITIES)

export default function GradeSelectScreen({ profile, onProfileUpdate, onSelect }: Props) {
  const [stats, setStats] = useState<Record<number, GradeStat>>({})
  const [rankMode, setRankMode] = useState<'grade' | 'global'>('grade')

  // 編集モード
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(profile.nickname)
  const [grade, setGrade] = useState(profile.grade)
  const [prefecture, setPrefecture] = useState(profile.prefecture)
  const [city, setCity] = useState(profile.city)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const cities = prefecture ? MUNICIPALITIES[prefecture] ?? [] : []

  const handlePrefectureChange = (pref: string) => {
    setPrefecture(pref)
    setCity('')
  }

  const handleSaveProfile = async () => {
    if (!nickname.trim()) { setEditError('ニックネームを入力してね'); return }
    if (!prefecture) { setEditError('都道府県を選んでね'); return }
    if (!city) { setEditError('市区町村を選んでね'); return }

    setSaving(true)
    setEditError('')
    try {
      const { error } = await supabase
        .from('users')
        .update({ nickname: nickname.trim(), grade, prefecture, city })
        .eq('id', profile.id)
      if (error) throw error

      const updated: UserProfile = { ...profile, nickname: nickname.trim(), grade, prefecture, city }
      onProfileUpdate(updated)
      setEditing(false)
    } catch (e) {
      setEditError('保存に失敗しました。もう一度お試しください。')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNickname(profile.nickname)
    setGrade(profile.grade)
    setPrefecture(profile.prefecture)
    setCity(profile.city)
    setEditError('')
    setEditing(false)
  }

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

        const { count: globalAbove } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)
          .gt('score', my.score)

        const { count: globalTotal } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)

        const { count: gradeAbove } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('grade_challenged', g)
          .eq('user_grade', profile.grade)
          .gt('score', my.score)

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

      {/* プロフィール表示 / 編集 */}
      {editing ? (
        <div className="bg-white rounded-3xl p-5 shadow-lg w-full max-w-sm mt-8 mb-6 space-y-4">
          <div className="font-black text-gray-700 text-base mb-1">プロフィールを変更</div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-base focus:border-indigo-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">学年</label>
            <div className="grid grid-cols-6 gap-1">
              {[1,2,3,4,5,6].map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-2 rounded-xl font-bold text-sm transition-all ${grade === g ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  小{g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">都道府県</label>
            <select
              value={prefecture}
              onChange={e => handlePrefectureChange(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-base focus:border-indigo-400 outline-none"
            >
              <option value="">選んでね</option>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">市区町村</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              disabled={!prefecture}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-base focus:border-indigo-400 outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{prefecture ? '選んでね' : '先に都道府県を選んでね'}</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {editError && <p className="text-red-500 text-sm">{editError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl transition-all"
            >
              {saving ? '保存中…' : '保存する'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm mt-8 mb-6 w-full max-w-sm">
          <span className="text-2xl">👤</span>
          <div className="flex-1">
            <div className="font-black text-gray-800 text-base leading-tight">{profile.nickname}</div>
            <div className="text-xs text-gray-400">{profile.prefecture} · 小{profile.grade}年生</div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-indigo-500 transition-colors p-1"
            title="プロフィールを編集"
          >
            ✏️
          </button>
        </div>
      )}

      <h2 className="text-3xl font-black text-indigo-700 mb-1">学年を選ぼう</h2>
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
