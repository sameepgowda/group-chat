import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Routes>
    <Route path="/" element={<Signup/>}></Route>
    <Route path="/home" element={<Home/>}></Route>
    <Route path="/login" element={<Login/>}></Route>
      
    </Routes>
          </>
  )
}

export default App
