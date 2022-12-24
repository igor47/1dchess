
class Piece {
  white: boolean | null = null
  piece: 'p' | 'r' | 'k' | 'b' | 'q' | 'K' | null = null
  selected: boolean = false
}

type SquareP = {
  idx: number,
  state: Piece[],
}

function initialBoard() {
  const pieces = Array(64).fill(null).map(() => new Piece())
  for (let i = 0; i < pieces.length; i++) {
    const row = i >> 3
    const col = i - (row << 3)

    if (row >= 6) pieces[i].white = false
    if (row <= 1) pieces[i].white = true

    if ([1,6].includes(row)) pieces[i].piece = 'p'
    if ([0,7].includes(row)) {
      if ([0, 7].includes(col)) {
        pieces[i].piece = 'r'
      } else if ([1, 6].includes(col)) {
        pieces[i].piece = 'k'
      } else if ([2, 5].includes(col)) {
        pieces[i].piece = 'b'
      } else if (col === 3) {
        pieces[i].piece = 'q'
      } else {
        pieces[i].piece = 'K'
      }
    }
  }

  return pieces
}

function Square({ idx, state }: SquareP) {
  const bg = (idx >> 3) % 2 === 0 ? (
    idx % 2 === 0 ? 'black': 'white') : ( idx % 2 === 0 ? 'white' : 'black' )

  const style = {
    backgroundColor: bg,
    color: bg === 'black' ? 'white' : 'black',
    minWidth: 128,
    height: 128,
  }

  return (
    <div style={ style }>{ state[idx].piece }</div>
  )
}

function Board() {
  const state = initialBoard()

  const squares = Array(64).fill(null).map((_v, idx) =>
    <Square key={idx} idx={idx} state={ state }/>
  )

  return (
    <div style={ { display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse' } }>
      { squares.reverse() }
    </div>
  )
}

export default Board
