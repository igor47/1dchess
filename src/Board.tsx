import { ReactNode } from 'react'

import { useSnapshot } from 'valtio'
import classNames from 'classnames'

import { state, handleClick, clearError } from './state'
import type { Square } from './state'

import { Pawn, Rook, Knight, Bishop, Queen, King } from './Pieces'

type SquareP = {
  square: Square,
}

function pieceEl(square: Square): ReactNode {
  const piece = square.piece
  if (piece === null)
    return (<svg width="64px" height="64px" />)

  const El =  {
    'p': Pawn,
    'r': Rook,
    'n': Knight,
    'b': Bishop,
    'q': Queen,
    'k': King,
  }[piece.piece]

  return <El size={ 64 } white={ piece.white } onWhite={ square.white } selected={ piece.selected } />
}

function SquareEl({ square }: SquareP) {
  const cls = classNames(
    'square',
    {
      white: square.white,
      black: !square.white,
      highlight: square.highlight,
      error: square.error,
    }
  )

  const piece = pieceEl(square)

  return (
    <div
      className={ cls }
      onClick={ () => handleClick(square.idx) }
      onAnimationEnd={ () => clearError(square.idx) }
    >
      { piece }
    </div>
  )
}

function Board() {
  const snap = useSnapshot(state)

  // we should start ordering like:
  // 56 ... 63
  // ...
  // 0 ... 7
  // so, 56 has the lowest ordering (should be 0), and 7 has the heighest (63)
  const squares = []
  for (let row = 7; row >= 0; row--) {
    for (let col = 0; col <= 7; col++) {
      const idx = (row << 3) + col
      const sq = snap.squares[idx]
      squares.push(
        <SquareEl key={idx} square={ sq } />
      )
    }
  }

  return (
    <div id="board">
      { squares }
    </div>
  )
}

export default Board
