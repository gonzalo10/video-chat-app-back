const express = require('express')
const app = express()
const server = require('http').createServer(app)
const socketIO = require('socket.io')

const isDev = process.env.NODE_ENV === 'dev'
const urlOrigin = isDev
	? 'http://localhost:3000'
	: 'https://video-chat-app-front.vercel.app'

const port = process.env.PORT || 5000

const io = socketIO(server, {
	cors: {
		origin: urlOrigin,
		methods: ['GET', 'POST'],
		allowedHeaders: ['my-custom-header']
	}
})

app.use('/', (req, res) => {
	res.send('<div>Server up and running!</div>')
})

io.on('connection', (socket) => {
	socket.on('join', (roomId) => {
		const availableRooms = io.sockets.adapter.rooms
		const numbClients = availableRooms.get(roomId) || { size: 0 }
		const numberOfClients = numbClients.size

		// These events are emitted only to the sender socket.
		if (numberOfClients == 0) {
			console.log(`Creating room:  ${roomId}`)
			socket.join(roomId)
			socket.emit('room_created', roomId)
		} else if (numberOfClients === 1) {
			console.log(`Joining room: ${roomId}`)
			socket.join(roomId)
			socket.emit('room_joined', roomId)
		} else {
			console.log(`Can't join room: ${roomId}`)
			socket.emit('full_room', roomId)
		}
	})

	socket.on('start_call', (roomId) => {
		console.log(`Broadcasting start_call:     ${roomId}`)
		socket.broadcast.to(roomId).emit('start_call')
	})
	socket.on('webrtc_offer', (event) => {
		console.log(`Broadcasting webrtc_offer:   ${event.roomId}`)
		socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
	})
	socket.on('webrtc_answer', (event) => {
		console.log(`Broadcasting webrtc_answer:  ${event.roomId}`)
		socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
	})
	socket.on('stop_video', (roomId) => {
		console.log(`Broadcasting stop_video:     ${roomId}`)
		socket.broadcast.to(roomId).emit('stop_video')
	})
	socket.on('webrtc_ice_candidate', (event) => {
		socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
	})
})

server.listen(port, () => {
	console.log(`Express server listening on port ${port}`)
})
