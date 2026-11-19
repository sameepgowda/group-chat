import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import ChatWindow from './pages/ChatWindow.jsx';
import './App.css';
import {Routes, Route} from 'react-router-dom';
import Home from './pages/Home.jsx';

function App() {


  return (
    <>
    <Routes>
    <Route path="/" element={<Signup/>}></Route>
    {/* <Route path="/chatWindow" element={<ChatWindow/>}></Route> */}
    <Route path="/login" element={<Login/>}></Route>
    <Route path="/home" element={<Home/>}></Route>
    
      
    </Routes>
          </>
  )
}

export default App
