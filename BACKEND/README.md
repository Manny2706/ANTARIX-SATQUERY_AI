# Frontend Socket Layer

This layer is responsible for establishing a Socket.IO connection with the backend and sending/receiving real-time messages.

## 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

## 2. Socket Connection

Create:

```text
src/
└── socket/
    └── socket.ts
```

### `socket.ts`

```ts
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:7000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
```

`autoConnect: false` means the socket will not connect immediately when the application starts.

We can connect it when required:

```ts
socket.connect();
```

And disconnect:

```ts
socket.disconnect();
```

---

# 3. Sending a Message

The frontend sends a message using the `message:send` event.

```ts
socket.emit("message:send", {
  key: "my-secret-key-123",
  message: "Explain SAT",
});
```

### Payload

```ts
{
  key: string;
  message: string;
}
```

The backend checks the `key` before processing the request.

```text
Frontend
   │
   │ message:send
   │
   │ {
   │   key,
   │   message
   │ }
   ▼
Backend
```

---

# 4. Receiving AI Response

The backend sends the response using:

```ts
message:response
```

Frontend:

```ts
socket.on("message:response", (data) => {
  console.log("AI Response:", data);
});
```

Example response:

```ts
{
  message: "SAT is a standardized test..."
}
```

---

# 5. Handling Errors

The backend can send:

```ts
message:error
```

Frontend:

```ts
socket.on("message:error", (error) => {
  console.error("Socket error:", error.message);
});
```

Example:

```ts
{
  message: "Unauthorized"
}
```

---

# 6. Complete Example

```ts
import { socket } from "./socket/socket";

export function connectSocket() {
  socket.connect();

  socket.on("connect", () => {
    console.log("🟢 Connected:", socket.id);
  });

  socket.on("message:response", (data) => {
    console.log("🤖 AI:", data);
  });

  socket.on("message:error", (error) => {
    console.error("❌ Error:", error.message);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected");
  });
}

export function sendMessage(message: string) {
  socket.emit("message:send", {
    key: "my-secret-key-123",
    message,
  });
}
```

---

# 7. Current Socket Events

| Event              | Direction          | Purpose             |
| ------------------ | ------------------ | ------------------- |
| `connect`          | Backend → Frontend | Socket connected    |
| `disconnect`       | Backend → Frontend | Socket disconnected |
| `message:send`     | Frontend → Backend | Send user message   |
| `message:response` | Backend → Frontend | Receive AI response |
| `message:error`    | Backend → Frontend | Receive error       |

---

# 8. Current Architecture

```text
┌──────────────────────┐
│       Frontend       │
│                      │
│  socket.ts           │
│      │               │
│      │ emit          │
│      ▼               │
│  message:send        │
└──────────┬───────────┘
           │
           │ Socket.IO
           ▼
┌──────────────────────┐
│       Backend        │
│                      │
│  chat.socket.ts      │
│      │               │
│      │ key check     │
│      ▼               │
│  chat.service.ts     │
│      │               │
│      ├── PostgreSQL  │
│      ├── ML Model    │
│      └── Response    │
│                      │
└──────────┬───────────┘
           │
           │ message:response
           ▼
┌──────────────────────┐
│       Frontend       │
│                      │
│   Display AI reply   │
└──────────────────────┘
```


