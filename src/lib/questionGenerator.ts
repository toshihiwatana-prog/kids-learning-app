export type Question = {
  expression: string
  answer: number
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function grade1(): Question {
  const op = pick(['+', '-'])
  if (op === '+') {
    const a = randInt(1, 10)
    const b = randInt(1, 20 - a)
    return { expression: `${a} + ${b}`, answer: a + b }
  } else {
    const a = randInt(1, 20)
    const b = randInt(0, a)
    return { expression: `${a} - ${b}`, answer: a - b }
  }
}

function grade2(): Question {
  const type = pick(['add', 'sub', 'mul'])
  if (type === 'add') {
    const a = randInt(1, 50)
    const b = randInt(1, 100 - a)
    return { expression: `${a} + ${b}`, answer: a + b }
  } else if (type === 'sub') {
    const a = randInt(1, 100)
    const b = randInt(0, a)
    return { expression: `${a} - ${b}`, answer: a - b }
  } else {
    const a = randInt(1, 9)
    const b = randInt(1, 9)
    return { expression: `${a} × ${b}`, answer: a * b }
  }
}

function grade3(): Question {
  const op = pick(['+', '-', '×', '÷'])
  if (op === '+') {
    const a = randInt(10, 500)
    const b = randInt(10, 999 - a)
    return { expression: `${a} + ${b}`, answer: a + b }
  } else if (op === '-') {
    const a = randInt(10, 999)
    const b = randInt(0, a)
    return { expression: `${a} - ${b}`, answer: a - b }
  } else if (op === '×') {
    const a = randInt(2, 20)
    const b = randInt(2, 20)
    return { expression: `${a} × ${b}`, answer: a * b }
  } else {
    const b = randInt(2, 12)
    const ans = randInt(1, 30)
    return { expression: `${b * ans} ÷ ${b}`, answer: ans }
  }
}

function grade4(): Question {
  const type = pick(['int', 'decimal_add', 'decimal_sub'])
  if (type === 'int') {
    const op = pick(['+', '-', '×', '÷'])
    if (op === '+') {
      const a = randInt(100, 5000)
      const b = randInt(100, 9999 - a)
      return { expression: `${a} + ${b}`, answer: a + b }
    } else if (op === '-') {
      const a = randInt(100, 9999)
      const b = randInt(0, a)
      return { expression: `${a} - ${b}`, answer: a - b }
    } else if (op === '×') {
      const a = randInt(2, 50)
      const b = randInt(2, 50)
      return { expression: `${a} × ${b}`, answer: a * b }
    } else {
      const b = randInt(2, 20)
      const ans = randInt(1, 50)
      return { expression: `${b * ans} ÷ ${b}`, answer: ans }
    }
  } else if (type === 'decimal_add') {
    const a = randInt(1, 50)
    const ad = randInt(0, 9)
    const b = randInt(1, 50)
    const bd = randInt(0, 9)
    const ans = a + b + (ad + bd) / 10
    if (Number.isInteger(ans)) {
      return { expression: `${a}.${ad} + ${b}.${bd}`, answer: ans }
    }
    return grade4()
  } else {
    const b = randInt(1, 20)
    const bd = randInt(1, 9)
    const ans = randInt(1, 20)
    const a = ans + b
    const ad = bd
    return { expression: `${a}.${ad} - ${b}.${bd}`, answer: ans }
  }
}

function grade5(): Question {
  const type = pick(['int', 'decimal_mul', 'decimal_div'])
  if (type === 'int') {
    return grade4()
  } else if (type === 'decimal_mul') {
    const a = randInt(1, 20)
    const b = randInt(1, 5)
    const bd = pick([2, 4, 5])
    const ans = (a * (b * 10 + bd)) / 10
    if (Number.isInteger(ans)) {
      return { expression: `${a} × ${b}.${bd}`, answer: ans }
    }
    return grade5()
  } else {
    const b = pick([2, 4, 5, 8, 10])
    const ans = randInt(1, 20)
    const dividend = ans * b
    return { expression: `${dividend} ÷ ${b}`, answer: ans }
  }
}

function grade6(): Question {
  return grade5()
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
