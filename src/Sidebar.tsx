import { useSnapshot } from 'valtio'
import classNames from 'classnames'

import { state, actions } from './state'
import type { Move, Square } from './state'

import { Rook, Knight, Bishop, Queen, King } from './Pieces'

import GameLogo from './assets/game.svg'
import IconX from './assets/X.svg'

type GetPromotionP = {
  move: Readonly<Move>,
  squares: Readonly<Array<Readonly<Square>>>,
}

function Flag({ size }: { size: number }) {
  const pStyle = {
    strokeLinejoin: 'miter',
    strokeLinecap: 'butt',
    strokeMiterlimit: 4,
    strokeWidth: 1,
    enableBackground:'accumulate',
    color:'#000000',
    stroke: '#000',
  } as const

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 26 26 ' height={size} width={size}>
      <path style={ pStyle } d="m15.5,22.5,7-18" fill="none"/>
      <path style={ pStyle } d="m4.5,8.5c2,2,4,4,7,5l2-5c-3,2-6,0-9,0z" fill="#FFF"/>
      <path style={ pStyle } d="m11.5,13.5s-2-1-1-2h3c0,1-1,2.4741-2,2z" fill="#808080"/>
      <path style={ pStyle }  d="m18.5,14.5c-2,0-4-4-8-3l3-7c3-1,6,2,8,2z" fill="#FFF"/>
    </svg>
  )
}

function GetPromotion({ move, squares }: GetPromotionP) {
  if (move === null) return null

  const origSquare = squares.find(sq => sq.idx === move.from)!
  const destSquare = squares.find(sq => sq.idx === move.to)!
  const piece = origSquare.piece!

  const promos = (['r', 'n', 'b', 'q'] as const).map(promo => {
    const El = {
      r: Rook,
      n: Knight,
      b: Bishop,
      q: Queen,
    }[promo]

    const name = { r: 'Rook', n: 'Knight', b: 'Bishop', q: 'Queen' }[promo]

    const cls = classNames('button')

    return (
      <div
        key={ promo }
        className={ cls }
        onClick={ () => actions.makeMove({...move, promotion: promo}) }
      >
        <El size={ 64 } white={ piece.white } onWhite={ true } selected={ false } />
        <h3>{ name }</h3>
      </div>
    )
  })

  return (
    <div className="promotion">
      <h2>What should your pawn become?</h2>
      {promos}
    </div>
  )
}

function NewGameButtons() {
  return (
    <div className="buttons">
      <div
        className="button"
        onClick={ actions.newGame }
      >
        <img src={ GameLogo } width="64" height="64" />
        <h3>New Game</h3>
      </div>
    </div>
  )
}

function ConfirmResign({ white }: { white: boolean }) {
  return (
    <div className="buttons">
      <div className="button" onClick={ () => actions.confirmResign(true) }>
        <King white={white} onWhite={false} selected={false} size={64} rotated={true} />
        <h3>Yes, I give up</h3>
      </div>

      <div className="button" onClick={ () => actions.confirmResign(false) }>
        <King white={white} onWhite={false} selected={false} size={64} rotated={false} />
        <h3>No, fight on!</h3>
      </div>
    </div>
  )
}

function AcceptDraw() {
  return (
    <div className="buttons">
      <div className="button" onClick={ () => actions.acceptDraw(true) }>
        <Flag size={64} />
        <h3>Accept, let there be peace</h3>
      </div>

      <div className="button" onClick={ () => actions.acceptDraw(false) }>
        <img src={ IconX } width="64" height="64" />
        <h3>No, fight on!</h3>
      </div>
    </div>
  )
}

type GameTimeButtonsP = {
  white: boolean,
}
function GameTimeButtons({ white }: GameTimeButtonsP) {
  return (
    <div className="buttons">
      <div className="button" onClick={ actions.beginResign }>
        <King white={white} onWhite={false} selected={false} size={64} rotated={true} />
        <h3>Resign</h3>
      </div>
      <div className="button" onClick={ actions.offerDraw }>
        <Flag size={64} />
        <h3>Offer Draw</h3>
      </div>
    </div>
  )
}

function Sidebar() {
  const snap = useSnapshot(state)

  const toMove = snap.whiteToMove ? 'White' : 'Black'
  let msg = `${toMove} to move...`

  if (snap.gameOver) {
    if (!snap.gameId) {
      msg = 'How about a nice game of chess?'
    } else if (snap.checkmate) {
      msg = `${toMove === 'Black' ? 'White' : 'Black'} Wins!`
    } else if (snap.stalemate) {
      msg = `${toMove === 'Black' ? 'White' : 'Black'} wins by stalemate!`
    } else if (snap.draw) {
      let reason = null
      if (snap.insufficientMaterial) reason = ' (insufficient material)'
      if (snap.threefoldRepetition) reason = ' (repetition)'
      if (snap.drawAccepted) reason = ' (mutual agreement)'

      msg = `Game Over -- Draw${ reason || ''}!`
    } else if (snap.resigned) {
      msg = `Game Over -- ${ snap.resigned } resigned!`
    }
  } else if (snap.check) {
    msg = `${toMove} is in check!`
  } else if (snap.confirmResign) {
    msg = `${toMove} is resigning?!`
  } else if (snap.drawOffered) {
    msg = `${toMove} offers a draw!`
  }

  let menu
  if (!snap.gameId || snap.gameOver) {
    menu = <NewGameButtons />
  } else if (snap.needsPromotion) {
    menu = <GetPromotion move={ snap.needsPromotion } squares={ snap.squares }/>
  } else if (snap.confirmResign) {
    menu = <ConfirmResign white={snap.whiteToMove} />
  } else if (snap.drawOffered) {
    menu = <AcceptDraw />
  } else {
    menu = <GameTimeButtons white={snap.whiteToMove} />
  }

  return (
    <div id="sidebar">
      <h1>1D Chess</h1>
      <h2 style={ {
        background: toMove === 'White' ? 'black' : 'white',
        color: toMove === 'White' ? 'white' : 'black',
        margin: 0,
        padding: '1rem',
        } }>{ msg }</h2>

      { menu }
    </div>
  )
}

export default Sidebar
