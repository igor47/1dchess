import { useState } from 'react'

import { useSnapshot } from 'valtio'
import classNames from 'classnames'

import { state, actions } from './state'
import type { Move, Square, State } from './state'

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

function ShareBtn() {
  const [copied, setCopied] = useState(false)
  const cls = classNames('button', { 'flash': copied })

  return (
    <div
      className={ cls }
      onClick={ async () => {
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        setCopied(true)
      }}
      onAnimationEnd={ () => setCopied(false) }
    >
      <h3>{ copied ? 'Copied! Send to opponent!' : 'Copy game link!' }</h3>
    </div>
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

type BothSidesP = Pick<State, 'userId' | 'white' | 'black'> & {
  watching: boolean,
}
function BothSides({ userId, white, black, watching}: BothSidesP) {
  const areBoth = white === black && white === userId

  let btn1 = null
  if (watching) {
    btn1 = <>
      <div>
        <h3>You're just watching!</h3>
      </div>
      <div
        className="button"
        onClick={ () => { window.location.assign(window.location.origin) } }>
        <h3>Start Your Own Game</h3>
      </div>
    </>

  } else if (areBoth) {
    btn1 = <>
      <div><h3>You're playing both sides!</h3></div>
      
    </>
  } else if (white && white == black) {
    btn1 = <>
      <div><h3>Move & claim a side!</h3></div>
    </>
  }

  return (
    <div className="buttons">
      { btn1 }
      <ShareBtn />
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

type AcceptDrawP = {
  white: boolean,
  black: boolean,
  offeredBy: 'white' | 'black'
}
function AcceptDraw({ white, black, offeredBy }: AcceptDrawP) {
  if (offeredBy === 'white' && white || offeredBy === 'black' && black) {
    return (
      <div className="buttons">
        <div className="button" onClick={ () => actions.acceptDraw(false) }>
          <img src={ IconX } width="64" height="64" />
          <h3>Nevermind, fight on!</h3>
        </div>
      </div>
    )
  } else {
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
}

type GameTimeButtonsP = {
  white: boolean,
  isWhite: boolean,
}
function GameTimeButtons({ white, isWhite }: GameTimeButtonsP) {
  let resign = null
  if (white === isWhite) {
    resign = (
      <div className="button" onClick={ actions.beginResign }>
        <King white={white} onWhite={false} selected={false} size={64} rotated={true} />
        <h3>Resign</h3>
      </div>
    )
  }

  return (
    <div className="buttons">
      { resign }
      <div className="button" onClick={ actions.offerDraw }>
        <Flag size={64} />
        <h3>Offer Draw</h3>
      </div>
      <ShareBtn />
    </div>
  )
}

function Sidebar() {
  const snap = useSnapshot(state)

  const toMove = snap.whiteToMove ? 'White' : 'Black'
  const isWhite = !snap.white || snap.white === snap.userId
  const isBlack = !snap.black || snap.black === snap.userId
  const watching = (!isWhite && !isBlack && snap.white !== snap.black)

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
  } else if (snap.whiteToMove && isWhite) {
    msg = `Your move, White!`
  } else if (!snap.whiteToMove && isBlack) {
    msg = `Your move, Black!`
  }

  let menu
  if (!snap.gameId || snap.gameOver) {
    menu = <NewGameButtons />
  } else if (snap.needsPromotion) {
    menu = <GetPromotion move={ snap.needsPromotion } squares={ snap.squares }/>
  } else if (snap.confirmResign) {
    menu = <ConfirmResign white={snap.whiteToMove} />
  } else if (snap.drawOffered) {
    menu = <AcceptDraw offeredBy={snap.drawOffered} white={isWhite} black={isBlack} />
  } else if (!(isWhite || isBlack) || (isWhite && isBlack)) {
    menu = <BothSides userId={snap.userId} white={snap.white} black={snap.black} watching={watching} />
  } else {
    menu = <GameTimeButtons white={snap.whiteToMove} isWhite={isWhite} />
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
