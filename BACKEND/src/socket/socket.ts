import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"
import { handleMessageSend } from "../service/chat.service"
import { SocketSendMessage } from "../types/socket.types"

export let io: Server
const initiateSocketConnection = async (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        }
    })
    io.on("connection", async (socket: Socket) => {
        console.log(`user connected with ${socket.id}`)

        //Message Event
        socket.on("message:send", async (data: SocketSendMessage) => {
            try {
                const { key, conversationId, message, image } = data
                if (!key || !message) {
                    return socket.emit("error", "Invalid message data")
                }

                if (key !== process.env.SOCKET_KEY) {
                    socket.emit("message:error", {
                        message: "Unauthorized",
                    });
                    return
                }
                if (!conversationId) {
                    socket.emit("message:error", {
                        message: "Conversation ID is required",
                    })
                    return
                }
                console.log(" Key verified")
                console.log(`the message is : ${message} and the key is ${key}`)

                await handleMessageSend(socket, {
                    conversationId,
                    message,
                    image,
                })
            } catch (error) {
                console.log("ERROR: Error in message send", error)
                socket.emit("message:error", {
                    message: "Something went wrong",
                })
            }
        })

        socket.on("disconnect", () => {
            console.log(`user disconnected ${socket.id}`)
        })
    })
    return io
}



export default initiateSocketConnection