import { Socket } from "socket.io"
import { MLResponse, SocketChatData } from "../types/socket.types"
import { prisma } from "../config/db"


export const handleMessageSend = async (socket: Socket, data: SocketChatData) => {
  const { conversationId, message, image } = data
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  })
  if (!conversation) {
    socket.emit("message:error", {
      message: "Conversation not found",
    })
    return
  }
  if (!message && !image) {
    socket.emit("message:error", {
      message: "Message or image is required",
    });
    return;
  }
  //save user question to database
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "USER",
      content: message || null,
      // imageUrl will be added after Cloudinary
    },
  })


  //call LLM/Model server
  const formData = new FormData()

  formData.append("query", message || "")
  formData.append("max_retries", "3")

  if (image) {
    const blob = new Blob(
      [new Uint8Array(image)],
      {
        type: "image/png",
      }
    )
    formData.append("optical", blob, "optical.png")

    const mlUrl = process.env.ML_API_URL!
    const mlResponse = await fetch(
      mlUrl,
      {
        method: "POST",
        body: formData,
      }
    )
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text()
      console.error("ML API error: ", errorText);
      throw new Error(
        `ML API failed: ${mlResponse.status} - ${errorText}`
      )
    }
    const result = (await mlResponse.json()) as MLResponse

    //!Future check ml response here
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: "ASSISTANT",

        content: result.final_answer,

        metadata: {
          confidence: result.confidence,
          current_task: result.current_task,
          temporal_mode: result.temporal_mode,
          modalities: result.modalities,
          image_count: result.image_count,
          input_valid: result.input_valid,
          validation_errors: result.validation_errors,
          retry_count: result.retry_count,
          reflection: result.reflection
            ? {
              decision: result.reflection.decision,
              required_action: result.reflection.required_action,
              reason: result.reflection.reason,
              confidence: result.reflection.confidence,
              evidence_confidence: result.reflection.evidence_confidence,
              min_confidence: result.reflection.min_confidence,
              retry_count: result.reflection.retry_count,
            }
            : null,
          duration_seconds: result.duration_seconds,
        },
      },
    })

    socket.emit("message:response", {
      userMessage,
      assistantMessage,
    })
  }
}