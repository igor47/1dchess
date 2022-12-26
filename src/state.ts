import { proxy } from 'valtio'
import { Chess } from 'chess.js'
import type { Square as cSquare, Move as cMove } from 'chess.js'

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
  white: boolean
  piece: Piece | null = null
  highlight: boolean = false
  error: boolean = false

  constructor (idx: number) {
    this.idx = idx

    const row = idx >> 3
    const col = idx - (row << 3)

    this.white = (row % 2 !== col % 2)
  }
}

type Move = {
  from: number,
  to: number,
  promotion: boolean,
}

function emptySquares() {
  return Array(64).fill(null).map((_v, idx) => new Square(idx))
}

type State = {
  chess: Chess,
  squares: Square[],
}

const state = proxy<State>({
  chess: new Chess(),
  squares: []
})


function clearError(idx: Square['idx']) {
  const cur = getSquare(idx)
  cur.error = false
}

function handleClick(idx: Square['idx']) {
  const cur = getSquare(idx)
  const prevSelected = state.squares.find(sq => sq.piece?.selected)

  const whiteMoves = state.chess.turn() === 'w'

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
    const move = moves.find(m => m.to === cur.idx)
    if (move) {
      makeMove(move)
    } else {
      highlightAvailable(cur)
      prevSelected.piece!.selected = false
      cur.error = true
    }
  }
}

async function makeMove(move: Move, promotion: cMove['promotion'] = undefined) {
  if (move.promotion) {
    // todo: prompt for promotion
  }

  // make the move in chess.js
  state.chess.move({
    from: idxToSq(move.from),
    to: idxToSq(move.to),
    promotion,
  })

  // update the squares
  chessToSquares()
}

function highlightAvailable(cur: Square) {
  const moves = validMovesFor(cur.idx)
  for (const sq of state.squares) {
    sq.highlight = moves.map(m => m.to).includes(sq.idx)
  }
}

const colNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
function idxToSq(idx: number) {
  const row = idx >> 3
  const col = idx - (row << 3)

  const colName = colNames[col]
  return `${colName}${row + 1}` as cSquare
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

function validMovesFor(idx: Square['idx']): Array<Move> {
  const moves = state.chess.moves({
    verbose: true,
    square: idxToSq(idx)
  }) as cMove[]

  return moves.map((move) => ({
    from: idx,
    to: sqToIdx(move.to),
    promotion: move.flags.includes('p'),
  }))
}

function chessToSquares() {
  const squares = emptySquares()
  for (const cq of state.chess.board().flat()) {
    if (cq) {
      const sq = squares.find(sq => sq.idx === sqToIdx(cq.square))!
      sq.piece = new Piece(cq.color === 'w', cq.type)
    }
  }

  state.squares = squares
}

chessToSquares()

export {
  state,
  handleClick,
  clearError,
}

export type {
  Piece,
  Square,
}
