import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { MUNICIPALITIES } from '../lib/municipalities'
import type { UserProfile } from '../types'

const PREFECTURES = Object.keys(MUNICIPALITIES)

type Props = {
  onComplete: (profile: UserProfile) => void
}

export default function ProfileScreen({ onComplete }: Props) {
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState(3)
  const [prefecture, setPrefecture] = useState('')
  const [city, setCity] = useState('')

  const cities = prefecture ? MUNICIPALITIES[prefecture] ?? [] : []

  const handlePrefectureChange = (pref: string) => {
    setPrefecture(pref)
    setCity('') // 都道府県が変わったら市区町村をリセット
  }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!nickname.trim()) { setError('ニックネームを入力してね'); return }
    if (!prefecture) { setError('都道府県を選んでね'); return }
    if (!city) { setError('市区町村を選んでね'); return }

    setSaving(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError) throw authError

      const userId = authData.user!.id
      const { error: dbError } = await supabase.from('users').insert({
        id: userId,
        nickname: nickname.trim(),
        grade,
        prefecture,
        city: city.trim(),
      })
      if (dbError) throw dbError

      onComplete({ id: userId, nickname: nickname.trim(), grade, prefecture, city: city.trim() })
    } catch (e) {
      setError('エラーが発生しました。もう一度お試しください。')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h2 className="text-3xl font-black text-indigo-700 mb-2">プロフィール設定</h2>
      <p className="text-gray-500 mb-8 text-sm">最初に一度だけ設定するよ</p>

      <div className="bg-white rounded-3xl p-6 shadow-lg w-full max-w-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">ニックネーム</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={20}
            placeholder="たろう"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-indigo-400 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">学年</label>
          <div className="grid grid-cols-6 gap-1">
            {[1,2,3,4,5,6].map(g => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${grade === g ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                小{g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">都道府県</label>
          <select
            value={prefecture}
            onChange={e => handlePrefectureChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-indigo-400 outline-none"
          >
            <option value="">選んでね</option>
            {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">市区町村</label>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            disabled={!prefecture}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-indigo-400 outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">{prefecture ? '選んでね' : '先に都道府県を選んでね'}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xl font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95"
        >
          {saving ? '保存中…' : 'ゲームスタート！'}
        </button>
      </div>
    </div>
  )
}
