import { useState, useCallback } from 'react'
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

  const handleStart = () => {
    setScreen(profile ? 'grade-select' : 'profile')
  }

  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p)
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
