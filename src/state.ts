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
  selected: boolean = false

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
}

const state = proxy<State>({
  squares: initialBoard(),
})

function handleClick(square: Square) {
  if (square.piece) {
    for (const s of state.squares) {
      if (s.piece) {
        s.piece.selected = s.idx === square.idx
      }
    }
  }
}

export {
  state,
  handleClick,
}

export type {
  Piece,
  Square,
}
