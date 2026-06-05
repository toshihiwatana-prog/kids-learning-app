export type Question = {
  expression: string   // 横表示用（割り算など）
  answer: number
  vertical?: {         // 筆算表示用（あれば筆算で表示）
    top: string
    bottom: string
    operator: string
  }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 小数点以下の桁数を揃える（筆算の縦揃え用）
function alignDecimals(a: string, b: string): [string, string] {
  const da = (a.split('.')[1] ?? '').length
  const db = (b.split('.')[1] ?? '').length
  const max = Math.max(da, db)
  if (max === 0) return [a, b]
  const fa = da < max ? a + (da === 0 ? '.' : '') + '0'.repeat(max - da) : a
  const fb = db < max ? b + (db === 0 ? '.' : '') + '0'.repeat(max - db) : b
  return [fa, fb]
}

// --- 1年生: たし算・ひき算（〜20）横表示 ---
function grade1(): Question {
  const op = pick(['+', '-'])
  if (op === '+') {
    const a = randInt(1, 10)
    const b = randInt(1, 20 - a)
    return { expression: `${a} + ${b}`, answer: a + b }
  } else {
    const a = randInt(2, 20)
    const b = randInt(1, a)
    return { expression: `${a} - ${b}`, answer: a - b }
  }
}

// --- 2年生: たし算・ひき算（〜100）+ 九九 ---
function grade2(): Question {
  const type = pick(['add', 'sub', 'mul'])
  if (type === 'add') {
    const a = randInt(10, 50)
    const b = randInt(10, 100 - a)
    return {
      expression: `${a} + ${b}`,
      answer: a + b,
      vertical: { top: String(a), bottom: String(b), operator: '+' },
    }
  } else if (type === 'sub') {
    const a = randInt(20, 100)
    const b = randInt(10, a - 1)
    return {
      expression: `${a} - ${b}`,
      answer: a - b,
      vertical: { top: String(a), bottom: String(b), operator: '-' },
    }
  } else {
    // 九九は横表示のまま
    const a = randInt(2, 9)
    const b = randInt(2, 9)
    return { expression: `${a} × ${b}`, answer: a * b }
  }
}

// --- 3年生: 3桁の四則 + 2桁×1桁（繰り上がりなしを多め）---
function grade3(): Question {
  const op = pick(['+', '-', '×', '×', '÷']) // ×を多めに
  if (op === '+') {
    const a = randInt(20, 400)
    const b = randInt(20, 999 - a)
    return {
      expression: `${a} + ${b}`,
      answer: a + b,
      vertical: { top: String(a), bottom: String(b), operator: '+' },
    }
  } else if (op === '-') {
    const a = randInt(50, 999)
    const b = randInt(10, a - 1)
    return {
      expression: `${a} - ${b}`,
      answer: a - b,
      vertical: { top: String(a), bottom: String(b), operator: '-' },
    }
  } else if (op === '×') {
    // 2桁×1桁、繰り上がりなしを70%
    const easy = Math.random() < 0.7
    const a = easy ? randInt(11, 40) : randInt(11, 99)
    const b = easy ? randInt(2, 4) : randInt(2, 9)
    return {
      expression: `${a} × ${b}`,
      answer: a * b,
      vertical: { top: String(a), bottom: String(b), operator: '×' },
    }
  } else {
    // 2桁÷1桁（横）
    const b = randInt(2, 9)
    const ans = randInt(2, 15)
    return { expression: `${b * ans} ÷ ${b}`, answer: ans }
  }
}

// --- 4年生: 大きな数の四則 + 2桁×2桁（きりのいい数） + 小数足し引き ---
function grade4(): Question {
  const type = pick(['int', 'int', 'decimal_add', 'decimal_sub'])
  if (type === 'int') {
    const op = pick(['+', '-', '×', '×', '÷'])
    if (op === '+') {
      const a = randInt(100, 2000)
      const b = randInt(100, 5000 - a)
      return {
        expression: `${a} + ${b}`,
        answer: a + b,
        vertical: { top: String(a), bottom: String(b), operator: '+' },
      }
    } else if (op === '-') {
      const a = randInt(200, 5000)
      const b = randInt(100, a - 1)
      return {
        expression: `${a} - ${b}`,
        answer: a - b,
        vertical: { top: String(a), bottom: String(b), operator: '-' },
      }
    } else if (op === '×') {
      // 2桁×2桁、片方がきりのいい数
      const easyNums = [10, 11, 12, 15, 20, 21, 22, 25, 30]
      const a = pick(easyNums)
      const b = randInt(11, 50)
      return {
        expression: `${a} × ${b}`,
        answer: a * b,
        vertical: { top: String(Math.max(a, b)), bottom: String(Math.min(a, b)), operator: '×' },
      }
    } else {
      // 3桁÷1桁（横）
      const b = randInt(2, 9)
      const ans = randInt(10, 50)
      return { expression: `${b * ans} ÷ ${b}`, answer: ans }
    }
  } else if (type === 'decimal_add') {
    const a = randInt(1, 30)
    const ad = randInt(1, 9)
    const b = randInt(1, 20)
    const bd = randInt(1, 9)
    const ansRaw = a + b + (ad + bd) / 10
    const ans = Math.round(ansRaw * 10) / 10
    const [ta, tb] = alignDecimals(`${a}.${ad}`, `${b}.${bd}`)
    return {
      expression: `${a}.${ad} + ${b}.${bd}`,
      answer: ans,
      vertical: { top: ta, bottom: tb, operator: '+' },
    }
  } else {
    // 小数引き算：a.x - b.x（同じ小数桁）
    const b = randInt(1, 20)
    const bd = randInt(1, 8)
    const extra = randInt(1, 20)
    const a = b + extra
    const ad = bd  // 同じ小数部にして割り切れるように
    const ans = extra
    return {
      expression: `${a}.${ad} - ${b}.${bd}`,
      answer: ans,
      vertical: { top: `${a}.${ad}`, bottom: `${b}.${bd}`, operator: '-' },
    }
  }
}

// --- 5年生: 2桁×2桁（ランダム）+ 小数かけ算 + 小数割り算 ---
function grade5(): Question {
  const type = pick(['mul', 'mul', 'decimal_mul', 'decimal_div'])
  if (type === 'mul') {
    // 2桁×2桁 ランダム（積が大きすぎないよう制限）
    const a = randInt(11, 59)
    const b = randInt(11, 39)
    return {
      expression: `${a} × ${b}`,
      answer: a * b,
      vertical: { top: String(a), bottom: String(b), operator: '×' },
    }
  } else if (type === 'decimal_mul') {
    // 整数 × 小数(1位)、答えが整数になるよう調整
    const b_dec = pick([2, 4, 5]) // 0.2, 0.4, 0.5
    const a = randInt(2, 30)
    const ans = (a * b_dec) / 10
    if (!Number.isInteger(ans)) return grade5()
    const bStr = `0.${b_dec}`
    const [ta, tb] = alignDecimals(String(a), bStr)
    return {
      expression: `${a} × ${bStr}`,
      answer: ans,
      vertical: { top: ta, bottom: tb, operator: '×' },
    }
  } else {
    // 小数÷整数（横）
    const b = pick([2, 4, 5, 8])
    const ans = randInt(1, 15)
    const dividend = ans * b
    return { expression: `${dividend} ÷ ${b}`, answer: ans }
  }
}

// --- 6年生: 2桁×2桁（難しめ）+ 小数混合 ---
function grade6(): Question {
  const type = pick(['mul', 'mul', 'decimal_mul', 'decimal_div'])
  if (type === 'mul') {
    // 2桁×2桁 難しめ（大きい数）
    const a = randInt(23, 79)
    const b = randInt(13, 49)
    return {
      expression: `${a} × ${b}`,
      answer: a * b,
      vertical: { top: String(a), bottom: String(b), operator: '×' },
    }
  } else if (type === 'decimal_mul') {
    // 小数(1位) × 小数(1位)、答えが小数点1位になるもの
    const a_int = randInt(1, 9)
    const a_dec = pick([2, 4, 5])
    const b_int = randInt(1, 5)
    const b_dec = pick([2, 4, 5])
    const ans = Math.round((a_int + a_dec / 10) * (b_int + b_dec / 10) * 10) / 10
    if (!Number.isInteger(ans * 10)) return grade6()
    const aStr = `${a_int}.${a_dec}`
    const bStr = `${b_int}.${b_dec}`
    return {
      expression: `${aStr} × ${bStr}`,
      answer: ans,
      vertical: { top: aStr, bottom: bStr, operator: '×' },
    }
  } else {
    // 小数÷小数（横）
    const b_dec = pick([2, 4, 5])
    const ans = randInt(1, 20)
    const dividend = Math.round(ans * b_dec) / 10
    return {
      expression: `${dividend} ÷ 0.${b_dec}`,
      answer: ans,
    }
  }
}

const generators: Record<number, () => Question> = {
  1: grade1,
  2: grade2,
  3: grade3,
  4: grade4,
  5: grade5,
  6: grade6,
}

export function generateQuestion(grade: number): Question {
  return generators[grade]?.() ?? grade3()
}
