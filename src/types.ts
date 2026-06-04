export type Screen =
  | 'title'
  | 'profile'
  | 'grade-select'
  | 'countdown'
  | 'game'
  | 'result'

export type UserProfile = {
  id: string
  nickname: string
  grade: number
  prefecture: string
  city: string
}

export type GameResult = {
  score: number
  correctCount: number
  maxCombo: number
  gradeChallenge: number
}
