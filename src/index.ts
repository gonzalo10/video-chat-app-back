const express = require('express')
const app = express()
const server = require('http').createServer(app)
const socketIO = require('socket.io')

const isDev = process.env.NODE_ENV === 'dev'
const urlOrigin = isDev
	? 'http://localhost:3000'
	: 'https://video-chat-app-front.vercel.app'

const io = socketIO(server, {
	cors: {
		origin: urlOrigin,
		methods: ['GET', 'POST'],
		allowedHeaders: ['my-custom-header']
	}
})
// const io = socketIO(server)

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
			console.log(
				`Creating room ${roomId} and emitting room_created socket event`
			)
			socket.join(roomId)
			socket.emit('room_created', roomId)
		} else if (numberOfClients === 1) {
			console.log(
				`Joining room ${roomId} and emitting room_joined socket event`
			)
			socket.join(roomId)
			socket.emit('room_joined', roomId)
		} else {
			console.log(`Can't join room ${roomId}, emitting full_room socket event`)
			socket.emit('full_room', roomId)
		}
	})

	// These events are emitted to all the sockets connected to the same room except the sender.
	socket.on('start_call', (roomId) => {
		console.log(`Broadcasting start_call event to peers in room ${roomId}`)
		socket.broadcast.to(roomId).emit('start_call')
	})
	socket.on('webrtc_offer', (event) => {
		console.log(
			`Broadcasting webrtc_offer event to peers in room ${event.roomId}`
		)
		socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
	})
	socket.on('webrtc_answer', (event) => {
		console.log(
			`Broadcasting webrtc_answer event to peers in room ${event.roomId}`
		)
		socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
	})
	socket.on('webrtc_ice_candidate', (event) => {
		// console.log(
		// 	`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`
		// )
		socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
	})
})

// START THE SERVER =================================================================
const port = process.env.PORT || 5000
server.listen(port, () => {
	console.log(`Express server listening on port ${port}`)
})
