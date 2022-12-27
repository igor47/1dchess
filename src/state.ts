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
  from: Square['idx'],
  to: Square['idx'],
  needsPromotion: boolean,
  promotion?: cMove['promotion'],
}

function emptySquares() {
  return Array(64).fill(null).map((_v, idx) => new Square(idx))
}

type State = {
  chess: Chess,
  squares: Square[],
  needsPromotion: Move | null,

  gameOver: boolean,
  check: boolean,
  checkmate: boolean,
  stalemate: boolean,
  draw: boolean,
  insufficientMaterial: boolean,
  threefoldRepetition: boolean,

  drawOffered: false | 'white' | 'black',
  drawAccepted: boolean,

  resigned: false | 'white' | 'black',
  confirmResign: boolean,

  highlightOffered: false | 'white' | 'black',
  highlightAccepted: boolean,
}

const state = proxy<State>({
  chess: new Chess(),
  squares: [],
  needsPromotion: null,

  gameOver: false,
  check: false,
  checkmate: false,
  stalemate: false,
  draw: false,
  insufficientMaterial: false,
  threefoldRepetition: false,

  drawOffered: false,
  drawAccepted: false,

  resigned: false,
  confirmResign: false,

  highlightOffered: false,
  highlightAccepted: true,
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

async function makeMove(move: Move) {
  if (move.needsPromotion && !move.promotion) {
    state.needsPromotion = move
    return
  }

  state.needsPromotion = null

  // make the move in chess.js
  state.chess.move({
    from: idxToSq(move.from),
    to: idxToSq(move.to),
    promotion: move.promotion,
  })

  // update the squares
  chessToSquares()
}

function highlightAvailable(cur: Square) {
  if (!state.highlightAccepted) return

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
    needsPromotion: move.flags.includes('p'),
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
  state.gameOver = state.chess.isGameOver()
  state.check = state.chess.isCheck()
  state.checkmate = state.chess.isCheckmate()
  state.stalemate = state.chess.isStalemate()
  state.draw = state.chess.isDraw()
  state.insufficientMaterial = state.chess.isInsufficientMaterial()
  state.threefoldRepetition = state.chess.isThreefoldRepetition()
}

chessToSquares()

export {
  state,
  handleClick,
  clearError,
  makeMove,
}

export type {
  Piece,
  Square,
  Move,
}
