import { ReactNode, useState, useEffect } from 'react'

import { useSnapshot } from 'valtio'
import classNames from 'classnames'

import { state, actions } from './state'
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
      onClick={ () => actions.handleClick(square.idx) }
      onAnimationEnd={ () => actions.clearError(square.idx) }
    >
      { piece }
    </div>
  )
}

function calcCols() {
  const pixels = screen.width

  /*
   * okay, so, we have 20 * 2 = 40px padding
   * 20px margin between board and sidebar
   * 300px for the sidebar
   * total: 400px
   * so, we have truly-1d chess if media width < 496, and then every 96px after
   */
  const maxCols = 18
  const staticWidth = 400
  const colWidth = 96

  const maxWidth = staticWidth + maxCols*colWidth
  const minWidth = staticWidth + colWidth
  const avail = Math.max(Math.min(pixels, maxWidth), minWidth)

  const cols = Math.floor((avail - staticWidth) / colWidth)
  console.log(`resizing to ${cols} cols (${pixels})`)
  return cols === 8 ? 7 : cols
}

function Board() {
  const snap = useSnapshot(state)

  const [cols, setCols] = useState(calcCols())
  const resize = () => { setCols(calcCols) }

  // resize board when window size/orientation changes
  useEffect(() => {
    window.onresize = resize

    const abortRotate = new AbortController()
    window.screen.orientation.addEventListener(
      'change', resize, { signal: abortRotate.signal })

    return () => {
      window.onresize = null
      abortRotate.abort()
    }
  }, [setCols])

  // set the game from game ID in url
  useEffect(() => {
    const path = window.location.pathname
    if (path === '/') return

    const gameId = path.slice(1)
    if (gameId) {
      actions.connectToGame(gameId)
    }
  }, [])

  const squares = snap.squares.map((sq, idx) =>
    <SquareEl key={idx} square={ sq } />
  )

  // never allow 8 columns!
  const useCols = cols === 8 ? 7 : cols

  const style = {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row-reverse',
    marginRight: '20px',
    maxWidth: `${useCols * 96}px`,
    border: '1px dotted gray',
  } as const

  return (
    <div id='board' style={ style }>
      { squares.reverse() }
    </div>
  )
}

export default Board
