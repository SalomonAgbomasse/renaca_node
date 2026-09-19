import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  // Connect to the Socket.IO server
  connect() {
    this.socket = io(process.env.VUE_APP_BACKEND_URL || "http://localhost:3000", {
      transports: ["websocket", "polling"],
    });

    this.socket.on('connect', () => {
      console.log('Connected to the Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from the Socket.IO server');
    });
  }

  // Listen for a specific event from the server
  listenForEvent(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Emit an event to the server
  emitEvent(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Disconnect from the Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
