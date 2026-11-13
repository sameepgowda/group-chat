import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import './App.css';
import {Routes, Route} from 'react-router-dom';

function App() {


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
