import Board from './Board'
import Sidebar from './Sidebar'

import './App.css'

function App() {
  return (
    <div id="app">
      <h1>1D Chess</h1>
      <div id="game">
        <Board />
        <Sidebar />
      </div>
    </div>
  )
}

export default App
