import { ReactNode } from 'react'

import { Pawn, Rook, Knight, Bishop, Queen, King } from './Pieces'

class Piece {
  white: boolean
  piece: 'p' | 'r' | 'k' | 'b' | 'q' | 'K'

  constructor(white: boolean, piece: Piece['piece']) {
    this.white = white
    this.piece = piece
  }
}

class Square {
  idx: number
  white: boolean = true
  piece: Piece | null = null
  selected: boolean = false

  constructor (idx: number) {
    this.idx = idx
  }
}

type SquareP = {
  idx: number,
  state: Square[],
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

function pieceEl(square: Square): ReactNode {
  const piece = square.piece
  if (piece === null)
    return (<svg width="64px" height="64px" />)

  const El =  {
    'p': Pawn,
    'r': Rook,
    'k': Knight,
    'b': Bishop,
    'q': Queen,
    'K': King,
  }[piece.piece]

  return <El size={ 64 } white={ piece.white } onWhite={ square.white } selected={ square.selected } />
}

function SquareEl({ idx, state }: SquareP) {
  const square = state[idx]

  const style = {
    backgroundColor: square.white ? 'white' : 'black',
    padding: '16px',
  }

  const piece = pieceEl(state[idx])

  return (
    <div style={ style }>
      { piece }
    </div>
  )
}

function Board() {
  const state = initialBoard()

  const squares = state.map((_wq, idx) =>
    <SquareEl key={idx} idx={idx} state={ state }/>
  )

  return (
    <div style={ { display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse' } }>
      { squares.reverse() }
    </div>
  )
}

export default Board
