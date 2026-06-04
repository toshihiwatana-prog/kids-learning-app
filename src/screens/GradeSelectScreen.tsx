type Props = {
  userGrade: number
  onSelect: (grade: number) => void
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

export default function GradeSelectScreen({ userGrade, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <h2 className="text-3xl font-black text-indigo-700 mt-10 mb-1">学年を選ぼう</h2>
      <p className="text-gray-500 text-sm mb-8">どの学年の問題に挑戦する？</p>

      <div className="w-full max-w-sm space-y-3">
        {[1,2,3,4,5,6].map(g => (
          <button
            key={g}
            onClick={() => onSelect(g)}
            className={`w-full bg-gradient-to-r ${GRADE_COLORS[g]} text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-md active:scale-95 transition-all`}
          >
            <div className="text-left">
              <div className="font-black text-xl">小学{g}年生</div>
              <div className="text-sm opacity-90">{GRADE_LABELS[g]}</div>
            </div>
            <div className="flex items-center gap-2">
              {g === userGrade && (
                <span className="bg-white/30 text-white text-xs font-bold px-2 py-1 rounded-full">自分の学年</span>
              )}
              <span className="text-2xl">▶</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
