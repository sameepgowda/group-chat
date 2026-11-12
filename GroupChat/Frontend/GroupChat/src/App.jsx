
import './App.css'

function App() {


  return (
    <>
    <Routes>
    <Route path="/" element={<Signup/>}></Route>
    {/* <Route path="/home" element={<Home/>}></Route> */}
    <Route path="/login" element={<Login/>}></Route>
      
    </Routes>
          </>
  )
}

export default App
