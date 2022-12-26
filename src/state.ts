import { proxy } from 'valtio'
import { Chess } from 'chess.js'
import type { Square as Sq, Move } from 'chess.js'

class Piece {
  white: boolean
  piece: 'p' | 'r' | 'n' | 'b' | 'q' | 'k'
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
        piece = 'n'
      } else if ([2, 5].includes(col)) {
        piece = 'b'
      } else if (col === 3) {
        piece = 'q'
      } else {
        piece = 'k'
      }
    }

    if (piece !== null) {
      squares[i].piece = new Piece(pieceWhite, piece)
    }
  }

  return squares
}

type State = {
  chess: Chess,
  squares: Square[],
}

const state = proxy<State>({
  chess: new Chess(),
  squares: initialBoard(),
})

function handleClick(square: Square) {
  const whiteMoves = state.chess.turn() === 'w'

  const cur = getSquare(square.idx)
  const prevSelected = state.squares.find(sq => sq.piece?.selected)

  // nothing previously selected
  if (!prevSelected) {
    // just clicking on a random square
    if (!cur.piece) {
      cur.error = true

    // clicked on a piece that can move
    } else if (cur.piece.white === whiteMoves) {
      cur.piece.selected = true
      highlightAvailable(cur)

    // clicked on an enemy piece
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
      return
    }

    // if we got here, we're trying to make a move
    const moves = validMovesFor(prevSelected.idx)
    if (moves.includes(cur.idx)) {
      state.chess.move({
        from: idxToSq(prevSelected.idx),
        to: idxToSq(cur.idx),
      })

      cur.piece = prevSelected.piece!
      cur.piece.selected = false
      prevSelected.piece = null
    } else {
      highlightAvailable(cur)
      prevSelected.piece!.selected = false
      cur.error = true
    }
  }
}

function clearError(square: Square) {
  const cur = getSquare(square.idx)
  cur.error = false
}

function highlightAvailable(cur: Square) {
  const moves = validMovesFor(cur.idx)
  for (const sq of state.squares) {
    sq.highlight = moves.includes(sq.idx)
  }
}

const colNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
function idxToSq(idx: number) {
  const row = idx >> 3
  const col = idx - (row << 3)

  const colName = colNames[col]
  return `${colName}${row + 1}` as Sq
}

function sqToIdx(sq: string) {
  const colName = sq[0]
  const col = colNames.indexOf(colName)

  const row = Number(sq[1]) - 1
  return (row << 3) + col
}


function getSquare(idx: number): Square {
  if (idx < 0 || idx > 63)
    throw new Error(`invalid index ${idx}`)

  return state.squares.find(sq => sq.idx === idx)!
}

function validMovesFor(idx: Square['idx']): Array<number> {
  console.dir(idxToSq(idx))

  const moves = state.chess.moves({
    verbose: true,
    square: idxToSq(idx)
  }) as Move[]

  console.dir(moves)

  return moves.map((move) => sqToIdx(move.to))
}

export {
  state,
  handleClick,
  clearError,
}

export type {
  Piece,
  Square,
}
