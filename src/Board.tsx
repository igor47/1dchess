
type SquareP = {
  idx: number,
}

function Square({ idx }: SquareP) {
  const bg = idx % 2 === 0 ? 'white': 'black'
  const style = {
    backgroundColor: bg,
    color: bg === 'black' ? 'white' : 'black',
    minWidth: 128,
    height: 128,
  }

  return (
    <div style={ style }>S</div>
  )
}

function Board() {
  return (
    <div style={ { display: 'flex' } }>
      { Array(64).fill().map((_v, idx) => <Square key={idx} idx={idx} />) }
    </div>
  )
}

export default Board
