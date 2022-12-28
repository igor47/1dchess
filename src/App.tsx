import Board from './Board'
import Sidebar from './Sidebar'

import './App.css'

function App() {
  return (
    <div id="app">
      <div id="game">
        <Board />
        <Sidebar />
      </div>
      <div id="footer">
        Made for funsies by <a href="https://igor.moomers.org">igor47</a>.
        Code <a href="https://github.com/igor47/1dchess">on Github</a>.
      </div>
    </div>
  )
}

export default App
