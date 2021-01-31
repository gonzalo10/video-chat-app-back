import express, { Application } from 'express'
import { Server as SocketIOServer } from 'socket.io'
import { createServer, Server as HTTPServer } from 'http'
const io = require('socket.io')

export class Server {
	private httpServer: HTTPServer
	private app: Application
	private io: SocketIOServer

	private activeSockets: string[] = []

	private readonly DEFAULT_PORT = 5000

	constructor() {
		this.initialize()
	}

	private initialize(): void {
		this.app = express()
		this.httpServer = createServer(this.app)
		this.io = io(this.httpServer, {
			cors: {
				origin: 'http://localhost:3000',
				methods: ['GET', 'POST'],
				allowedHeaders: ['my-custom-header']
			}
		})

		this.configureRoutes()
		this.handleSocketConnection()
	}

	private configureRoutes(): void {
		this.app.get('/', (req, res) => {
			res.send('<div>Hola Mundo!</div>')
		})
	}

	private handleSocketConnection(): void {
		this.io.on('connection', (socket) => {
			const existingSocket = this.activeSockets.find(
				(existingSocket) => existingSocket === socket.id
			)

			if (!existingSocket) {
				this.activeSockets.push(socket.id)

				socket.emit('update-user-list', {
					users: this.activeSockets.filter(
						(existingSocket) => existingSocket !== socket.id
					)
				})

				socket.broadcast.emit('update-user-list', {
					users: [socket.id]
				})
			}

			socket.on('call-user', (data: any) => {
				socket.to(data.to).emit('call-made', {
					offer: data.offer,
					socket: socket.id
				})
			})

			socket.on('make-answer', (data) => {
				console.log('make-answer', socket.id)
				socket.to(data.to).emit('answer-made', {
					socket: socket.id,
					answer: data.answer
				})
			})

			socket.on('reject-call', (data) => {
				console.log('reject-call', socket.id)
				socket.to(data.from).emit('call-rejected', {
					socket: socket.id
				})
			})

			socket.on('disconnect', () => {
				console.log('disconnect')
				this.activeSockets = this.activeSockets.filter(
					(existingSocket) => existingSocket !== socket.id
				)
				socket.broadcast.emit('remove-user', {
					socketId: socket.id
				})
			})
		})
	}

	public listen(callback: (port: number) => void): void {
		this.httpServer.listen(this.DEFAULT_PORT, () => {
			callback(this.DEFAULT_PORT)
		})
	}
}
