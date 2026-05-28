import { useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')

  async function ping() {
    const res = await fetch('http://localhost:8000/hello')
    const data = await res.json()
    setMessage(data.message)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-stone-900">orma</h1>
      <p className="text-stone-500">a legibility tool for vibe coders</p>
      <button
        onClick={ping}
        className="px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-700 transition"
      >
        Ping backend
      </button>
      {message && <p className="text-stone-700 italic">{message}</p>}
    </div>
  )
}

export default App