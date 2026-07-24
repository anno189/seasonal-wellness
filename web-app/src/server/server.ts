/**
 * Local dev server entry
 */
import app from './app.js'

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use`)
  } else {
    console.error(err)
  }
})
