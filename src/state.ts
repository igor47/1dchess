
import { proxy } from 'valtio'
import { ref, set, get, onValue, update } from "firebase/database";

import { Chess } from 'chess.js'
import type { Square as cSquare, Move as cMove } from 'chess.js'

import randomstring from 'randomstring'

import { db } from './firestore'

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

type LocalState = {
  chess: Chess,
  listener: ReturnType<typeof onValue> | null,
}

type State = {
  gameId: string | null,
  userId: string,

  squares: Square[],
  needsPromotion: Move | null,

  gameOver: boolean,
  check: boolean,
  checkmate: boolean,
  stalemate: boolean,
  draw: boolean,
  insufficientMaterial: boolean,
  threefoldRepetition: boolean,
  whiteToMove: boolean,

  drawOffered: false | 'white' | 'black',
  drawAccepted: boolean,

  resigned: false | 'white' | 'black',
  confirmResign: boolean,

  highlightOffered: false | 'white' | 'black',
  highlightAccepted: boolean,
}

type RemoteState = Pick<State,
'userId' | 'gameId' | 'drawOffered' | 'drawAccepted' | 'resigned' |
  'highlightAccepted' | 'highlightOffered'
> & {
  gameFen: ReturnType<Chess['fen']>,
}

function emptySquares() {
  return Array(64).fill(null).map((_v, idx) => new Square(idx))
}

const localState: LocalState = {
  chess: new Chess(),
  listener: null,
}

const state = proxy<State>({
  gameId: null,
  userId: getUserId(),

  // does not get synced
  squares: emptySquares(),
  needsPromotion: null,
  confirmResign: false,

  // these are set from the `chess` element
  gameOver: true,
  check: false,
  checkmate: false,
  stalemate: false,
  draw: false,
  insufficientMaterial: false,
  threefoldRepetition: false,
  whiteToMove: true,

  // these are set by actions and synced to db
  drawOffered: false,
  drawAccepted: false,

  resigned: false,

  highlightOffered: false,
  highlightAccepted: true,
})

function getUserId() {
  let userId = window.localStorage.getItem('1dChessUserId')
  if (!userId) {
    userId = randomstring.generate()
    window.localStorage.setItem('1dChessUserId', userId)
  }
  return userId
}

async function newGame() {
  // reuse existing game id so connected folks can keep playing 
  const gameId = state.gameId || randomstring.generate({
    length: 16, readable: true, capitalization: 'lowercase'
  })

  // create new game in the db
  const data: RemoteState = {
    userId: state.userId,
    gameId: gameId,
   
    drawOffered: false,
    drawAccepted: false,

    resigned: false,

    highlightOffered: false,
    highlightAccepted: true,

    gameFen: (new Chess().fen()),
  }
  await set(ref(db, 'games/' + gameId), data)

  window.history.pushState({}, '', `/${gameId}`)
  connectToGame(gameId)
}

async function connectToGame(gameId: State['gameId']) {
  // make sure the game was created correctly
  const gameRef = ref(db, 'games/' + gameId)
  const snapshot = await get(gameRef)
  if (!snapshot.exists)
    return;

  // unsubscribe any existing listeners
  if (localState.listener) {
    localState.listener()
    localState.listener = null
  }

  // clear any current game
  localState.chess.clear()

  state.gameId = gameId
  localState.listener = onValue(
    gameRef, 
    (snapshot) => {
      const val = snapshot.val() as RemoteState
      if (!val) return

      localState.chess.load(val.gameFen)
      chessToState()

      state.drawOffered = val.drawOffered
      state.drawAccepted = val.drawAccepted

      state.resigned = val.resigned

      state.highlightOffered = val.highlightOffered
      state.highlightAccepted = val.highlightAccepted
    }
  )
}

function clearError(idx: Square['idx']) {
  const cur = getSquare(idx)
  cur.error = false
}

function handleClick(idx: Square['idx']) {
  const cur = getSquare(idx)
  const prevSelected = state.squares.find(sq => sq.piece?.selected)

  const whiteMoves = localState.chess.turn() === 'w'

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
  localState.chess.move({
    from: idxToSq(move.from),
    to: idxToSq(move.to),
    promotion: move.promotion,
  })

  // sync move to db
  await update(
    ref(db, 'games/' + state.gameId),
    { gameFen: localState.chess.fen() },
  )

  // update the squares
  chessToState()
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
  const moves = localState.chess.moves({
    verbose: true,
    square: idxToSq(idx)
  }) as cMove[]

  return moves.map((move) => ({
    from: idx,
    to: sqToIdx(move.to),
    needsPromotion: move.flags.includes('p'),
  }))
}

function chessToState() {
  const squares = emptySquares()
  for (const cq of localState.chess.board().flat()) {
    if (cq) {
      const sq = squares.find(sq => sq.idx === sqToIdx(cq.square))!
      sq.piece = new Piece(cq.color === 'w', cq.type)
    }
  }

  state.squares = squares
  state.gameOver = localState.chess.isGameOver()
  state.check = localState.chess.isCheck()
  state.checkmate = localState.chess.isCheckmate()
  state.stalemate = localState.chess.isStalemate()
  state.draw = localState.chess.isDraw()
  state.insufficientMaterial = localState.chess.isInsufficientMaterial()
  state.threefoldRepetition = localState.chess.isThreefoldRepetition()
  state.whiteToMove = localState.chess.turn() === 'w'
}

const actions = {
  handleClick,
  newGame,
  makeMove,
  clearError,
  connectToGame,
}

export {
  state,
  actions,
}

export type {
  Piece,
  Square,
  Move,
}
