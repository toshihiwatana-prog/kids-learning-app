type Props = {
  onStart: () => void
}

export default function TitleScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="text-8xl mb-6">🔢</div>
      <h1 className="text-4xl font-black text-indigo-700 mb-2">算数スピードゲーム</h1>
      <p className="text-lg text-indigo-500 mb-12">1分間で何問解けるかな？</p>

      <div className="bg-white rounded-3xl p-6 mb-10 shadow-lg max-w-sm w-full text-left">
        <h2 className="font-bold text-gray-700 mb-3">ゲームのルール</h2>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>⏱️ 1分間でできるだけ多く解こう</li>
          <li>🎯 正解すると+1点</li>
          <li>🔥 連続正解でコンボボーナス！</li>
          <li>❌ 不正解でもゲームは続くよ</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-2xl font-black px-12 py-5 rounded-full shadow-xl transition-all"
      >
        はじめる！
      </button>
    </div>
  )
}
