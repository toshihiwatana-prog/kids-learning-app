import { useState, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Screen, UserProfile, GameResult } from './types'
import TitleScreen from './screens/TitleScreen'
import ProfileScreen from './screens/ProfileScreen'
import GradeSelectScreen from './screens/GradeSelectScreen'
import CountdownScreen from './screens/CountdownScreen'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('title')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [gradeChallenge, setGradeChallenge] = useState(3)
  const [result, setResult] = useState<GameResult | null>(null)
  const [loading, setLoading] = useState(true)

  // 起動時：セッション復元（localStorage → Supabase の順で試みる）
  useEffect(() => {
    async function restoreSession() {
      // まずlocalStorageから復元を試みる
      const saved = localStorage.getItem('kids_game_profile')
      if (saved) {
        try {
          const p = JSON.parse(saved) as UserProfile
          // Supabaseセッションが有効か確認
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && session.user.id === p.id) {
            setProfile(p)
            setLoading(false)
            return
          }
        } catch {}
      }
      // localStorageになければSupabaseセッションから復元
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (user) {
          const p: UserProfile = {
            id: user.id,
            nickname: user.nickname,
            grade: user.grade,
            prefecture: user.prefecture,
            city: user.city,
          }
          setProfile(p)
          localStorage.setItem('kids_game_profile', JSON.stringify(p))
        }
      }
      setLoading(false)
    }
    restoreSession()
  }, [])

  const handleStart = () => {
    setScreen(profile ? 'grade-select' : 'profile')
  }

  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p)
    localStorage.setItem('kids_game_profile', JSON.stringify(p))
    setScreen('grade-select')
  }

  const handleGradeSelect = (grade: number) => {
    setGradeChallenge(grade)
    setScreen('countdown')
  }

  const handleCountdownComplete = useCallback(() => {
    setScreen('game')
  }, [])

  const handleGameComplete = useCallback((r: GameResult) => {
    setResult(r)
    setScreen('result')
  }, [])

  const handleReplay = () => {
    setScreen('countdown')
  }

  const handleChangeGrade = () => {
    setScreen('grade-select')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-spin">🔢</div>
      </div>
    )
  }

  return (
    <>
      {screen === 'title' && <TitleScreen onStart={handleStart} />}
      {screen === 'profile' && <ProfileScreen onComplete={handleProfileComplete} />}
      {screen === 'grade-select' && profile && (
        <GradeSelectScreen profile={profile} onSelect={handleGradeSelect} />
      )}
      {screen === 'countdown' && (
        <CountdownScreen key={gradeChallenge + Date.now()} onComplete={handleCountdownComplete} />
      )}
      {screen === 'game' && (
        <GameScreen key={gradeChallenge + '-game'} grade={gradeChallenge} onComplete={handleGameComplete} />
      )}
      {screen === 'result' && profile && result && (
        <ResultScreen
          result={result}
          profile={profile}
          onReplay={handleReplay}
          onChangeGrade={handleChangeGrade}
        />
      )}
    </>
  )
}
