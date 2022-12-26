import { ReactNode } from 'react'

import { useSnapshot } from 'valtio'
import classNames from 'classnames'

import { state, handleClick } from './state'
import type { Square } from './state'

import { Pawn, Rook, Knight, Bishop, Queen, King } from './Pieces'

import './assets/board.css'

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
    <div className={ cls } onClick={ () => handleClick(square) }>
      { piece }
    </div>
  )
}

function Board() {
  const snap = useSnapshot(state)

  const squares = snap.squares.map((sq, idx) =>
    <SquareEl key={idx} square={ sq } />
  )

  return (
    <div style={ { display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse' } }>
      { squares.reverse() }
    </div>
  )
}

export default Board
