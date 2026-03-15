import { useState } from 'react'
import './App.css'
import axios from 'axios'
import ReactMarkdown from "react-markdown"
import Loading from './Loading'

function App() {
  let [question, setQuestion] = useState("")

  let [data, setData] = useState("")
  let [loadingStatus, setLoadingStatus] = useState(false)

  let handleSubmit = (e)=> {
    e.preventDefault()
    setLoadingStatus(true)

    axios.post(`http://localhost:8000/ask`, {question})
    .then((res)=> res.data)
    .then((finalRes)=> {
      console.log(finalRes);
      if (finalRes._status){
        setData(finalRes.finalData)
        setLoadingStatus(false)
      }
    })
    console.log(question)
  }

  return (
    <>
      <h1 className='text-center font-bold text-4xl p-4'>Gemini AI Chat App</h1>

      <div className="max-w-[1320px] border-1 mx-auto grid grid-cols-[25%_auto] gap-5 p-5">
        <form onSubmit={handleSubmit} action="" className="shadow-lg">
          <textarea value={question} onChange={(e)=>setQuestion(e.target.value)} name="" id="" className='w-[100%] h-[200px] border-1 p-3'></textarea>
          <button className="bg-[#111115] text-white w-[100%] py-2">Create content</button>
        </form>

        <div className="border-l-1 border-[#ccc]">
          <div className="h-[300px] text-left overflow-scroll p-3">

            { loadingStatus ? <Loading/> : <ReactMarkdown>{data}</ReactMarkdown> }
            
          </div>
        </div>
      </div>
    </>
  )
}

export default App
