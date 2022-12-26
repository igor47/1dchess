import { proxy } from 'valtio'

class Piece {
  white: boolean
  piece: 'p' | 'r' | 'k' | 'b' | 'q' | 'K'
  selected: boolean = false

  constructor(white: boolean, piece: Piece['piece']) {
    this.white = white
    this.piece = piece
  }
}

class Square {
  idx: number
  white: boolean = true
  piece: Piece | null = null
  highlight: boolean = false
  error: boolean = false

  constructor (idx: number) {
    this.idx = idx
  }
}

function initialBoard() {
  const squares = Array(64).fill(null).map((_v, idx) => new Square(idx))
  for (let i = 0; i < squares.length; i++) {
    const row = i >> 3
    const col = i - (row << 3)

    if (row % 2 === 0) {
      squares[i].white = col % 2 === 0 ? false : true
    } else {
      squares[i].white = col % 2 === 0 ? true : false
    }

    let piece: Piece['piece'] | null = null
    const pieceWhite = row >= 6 ? false : true

    if ([1,6].includes(row)) piece = 'p'
    if ([0,7].includes(row)) {
      if ([0, 7].includes(col)) {
        piece = 'r'
      } else if ([1, 6].includes(col)) {
        piece = 'k'
      } else if ([2, 5].includes(col)) {
        piece = 'b'
      } else if (col === 3) {
        piece = 'q'
      } else {
        piece = 'K'
      }
    }

    if (piece !== null) {
      squares[i].piece = new Piece(pieceWhite, piece)
    }
  }

  return squares
}

type State = {
  squares: Square[],
  lastMove: { from: Square, to: Square} | null,
}

const state = proxy<State>({
  squares: initialBoard(),
  lastMove: null,
})

function handleClick(square: Square) {
  const whiteMoves = state.lastMove === null || !state.lastMove.to.piece!.white

  const cur = getSquare(square.idx)
  const prevSelected = state.squares.find(sq => sq.piece?.selected)

  if (!cur.piece && !prevSelected) {
    cur.error = true
    return
  }

  // nothing previously selected
  if (!prevSelected) {
    // clicked on a piece
    if (cur.piece && cur.piece.white === whiteMoves) {
      cur.piece.selected = true
      highlightAvailable(cur)

    // clicked on a random empty square for no reason
    } else {
      cur.error = true
    }

  // something selected
  } else {
    // one of our own pieces was selected
    if (cur.piece && cur.piece.white === whiteMoves) {
      prevSelected.piece!.selected = false
      cur.piece.selected = true
      highlightAvailable(cur)
    }

    // if we got here, we're trying to make a move
    const movingPiece = prevSelected.piece!
    const moves = validMovesFor(prevSelected.idx, movingPiece.piece, movingPiece.white)
    if (moves.includes(cur.idx)) {
      cur.piece = prevSelected.piece!
      cur.piece.selected = false
      prevSelected.piece = null
      state.lastMove = { from: prevSelected, to: cur }
    } else {
      cur.error = true
    }
  }
}

function highlightAvailable(cur: Square) {
  const moves = validMovesFor(cur.idx, cur.piece!.piece, cur.piece!.white)
  for (const sq of state.squares) {
    sq.highlight = moves.includes(sq.idx)
  }
}

function getSquare(idx: number): Square {
  if (idx < 0 || idx > 63)
    throw new Error(`invalid index ${idx}`)

  return state.squares.find(sq => sq.idx === idx)!
}

function isEmpty(idx: number): boolean {
  return !(getSquare(idx).piece)
}

function isEnemy(idx: number, white: boolean) {
  const sq = getSquare(idx)
  return sq.piece && sq.piece.white !== white
}

function enPassant(dest: number) {
  const last = state.lastMove

  // last move must've been a pawn
  if (!last) return false
  if (last.to.piece!.piece !== 'p') return false

  const destRow = dest >> 3
  const destCol = dest - (destRow << 3)

  const fromIdx = last.from.idx
  const fromRow = fromIdx >> 3
  const fromCol = fromIdx - (fromRow << 3)

  const toIdx = last.to.idx
  const toRow = toIdx >> 3
  const toCol = toIdx - (toRow << 3)

  return (
    fromCol === toCol && toCol === destCol && toRow === destRow && Math.abs(toRow - fromRow) === 2
  )
}

function validMovesFor(idx: Square['idx'], piece: Piece['piece'], white: boolean): Array<number> {
  const curRow = idx >> 3
  const curCol = idx - (curRow << 3)

  const valid: Array<number> = []
  if (piece === 'p') {
    if (white) {
      if (curRow < 6 && isEmpty(idx + 8))
        valid.push(idx + 8)
      if (curRow === 1 && isEmpty(idx + 16))
        valid.push(idx + 16)
      if (isEnemy(idx+7, white) || enPassant(idx + 7))
        valid.push(idx + 7)
      if (isEnemy(idx+9, white) || enPassant(idx + 9))
        valid.push(idx + 9)
    } else {
      if (curRow > 1 && isEmpty(idx - 8))
        valid.push(idx - 8)
      if (curRow === 6 && isEmpty(idx - 16))
        valid.push(idx - 16)
      if (isEnemy(idx-7, white) || enPassant(idx - 7))
        valid.push(idx - 7)
      if (isEnemy(idx-9, white) || enPassant(idx - 9))
        valid.push(idx - 9)
    }
  } else if (piece === 'r') {
    for(let nextCol = curCol + 1; nextCol <= 7; nextCol++) {
      const newIdx = curRow * 8 + nextCol
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

    for(let prevCol = curCol - 1; prevCol >= 0; prevCol--) {
      const newIdx = curRow * 8 + prevCol
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

    for(let nextRow = curRow + 1; nextRow <= 7; nextRow++) {
      const newIdx = nextRow * 8 + curCol
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

    for(let prevRow = curRow - 1; prevRow >= 0; prevRow--) {
      const newIdx = prevRow * 8 + curCol
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

  } else if (piece === 'k') {
    if (curRow + 2 <= 7) {
      if (curCol + 1 <= 7) {
        const newIdx = (curRow + 2) * 8 + curCol + 1
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
      if (curCol - 1 >= 0) {
        const newIdx = (curRow + 2) * 8 + curCol - 1
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
    }

    if (curRow + 1 <= 7) {
      if (curCol + 2 <= 7) {
        const newIdx = (curRow + 1) * 8 + curCol + 2
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
      if (curCol - 2 >= 0) {
        const newIdx = (curRow + 1) * 8 + curCol - 2
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
    }

    if (curRow - 1 >= 0) {
      if (curCol + 2 <= 7) {
        const newIdx = (curRow - 1) * 8 + curCol + 2
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
      if (curCol - 2 >= 0) {
        const newIdx = (curRow - 1) * 8 + curCol - 2
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
    }

    if (curRow - 2 >= 0) {
      if (curCol + 1 <= 7) {
        const newIdx = (curRow - 2) * 8 + curCol + 1
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
      if (curCol - 1 >= 0) {
        const newIdx = (curRow - 2) * 8 + curCol - 1
        if (isEmpty(newIdx) || isEnemy(newIdx, white)) valid.push(newIdx)
      }
    }
    
  } else if (piece === 'b') {
    for(let diff = 1; diff <= 7; diff++) {
      if (curRow + diff > 7 || curCol + diff > 7) break
      const newIdx = (curRow + diff) * 8 + curCol + diff
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

    for(let diff = 1; diff <= 7; diff++) {
      if (curRow + diff > 7 || curCol - diff < 0) break
      const newIdx = (curRow + diff) * 8 + curCol - diff
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

    for(let diff = 1; diff <= 7; diff++) {
      if (curRow - diff < 0 || curCol + diff > 7) break
      const newIdx = (curRow - diff) * 8 + curCol + diff
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }

    for(let diff = 1; diff <= 7; diff++) {
      if (curRow - diff < 0 || curCol - diff < 0) break
      const newIdx = (curRow - diff) * 8 + curCol - diff
      if (isEmpty(newIdx) || isEnemy(newIdx, white))
        valid.push(newIdx)
      if (!isEmpty(newIdx)) break;
    }
  } else if (piece === 'q') {
    return [
      ...validMovesFor(idx, 'r', white),
      ...validMovesFor(idx, 'b', white),
    ]
  } else if (piece === 'K') {

  }

  return valid
}

export {
  state,
  handleClick,
}

export type {
  Piece,
  Square,
}
