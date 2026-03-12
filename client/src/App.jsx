import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className='text-center font-bold text-4xl'>Gemini AI Chat App</h1>

      <div className="max-w-[1320px] mx-auto grid grid-cols-[25%_auto] gap-5">
        <form action="" className="shadow-lg">
          <textarea name="" id="" className='w-[100%] h-[200px] border-1'></textarea>
        </form>
      </div>
    </>
  )
}

export default App
