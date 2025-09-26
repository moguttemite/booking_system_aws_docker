'use client'

import { useState, useEffect } from 'react'

interface ApiResponse {
  message: string
  status: string
  version: string
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setApiData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2rem',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ marginBottom: '30px' }}>Booking System Frontend</h1>
      
      {loading && <p>Loading API data...</p>}
      
      {error && (
        <div style={{ 
          color: 'red', 
          textAlign: 'center',
          backgroundColor: '#ffe6e6',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #ff9999'
        }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {apiData && (
        <div style={{ 
          backgroundColor: '#f0f8ff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #87ceeb',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <h2 style={{ color: '#0066cc', marginBottom: '15px' }}>Backend API Response</h2>
          <div style={{ marginBottom: '10px' }}>
            <strong>Message:</strong> {apiData.message}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Status:</strong> 
            <span style={{ 
              color: apiData.status === 'running' ? 'green' : 'orange',
              marginLeft: '5px'
            }}>
              {apiData.status}
            </span>
          </div>
          <div>
            <strong>Version:</strong> {apiData.version}
          </div>
        </div>
      )}
    </main>
  )
}