import type {
  IncomingWsMessage,
  OutgoingWsMessage,
} from './realtime.types';
import { runtimeConfig } from '../../config/runtime';

type MessageHandler = (msg: IncomingWsMessage) => void;
type StatusHandler = (status: 'open' | 'closed' | 'error') => void;

export class WsClient {
  private socket: WebSocket | null = null;
  private pendingMessages: OutgoingWsMessage[] = [];
  private intentionalClose = false;

  connect(onMessage: MessageHandler, onStatus?: StatusHandler) {
    this.intentionalClose = false;
    this.socket = new WebSocket(runtimeConfig.wsUrl);

    this.socket.onopen = () => {
      onStatus?.('open');
      while (this.pendingMessages.length > 0) {
        const next = this.pendingMessages.shift();
        if (next) {
          this.socket?.send(JSON.stringify(next));
        }
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data: IncomingWsMessage = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.socket.onclose = () => {
      onStatus?.('closed');
    };

    this.socket.onerror = () => {
      // Keep WS errors out of console spam; connection state is tracked in Redux.
      if (!this.intentionalClose) {
        onStatus?.('error');
      }
    };
  }

  send(message: OutgoingWsMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }

    this.pendingMessages.push(message);
  }

  disconnect() {
    this.intentionalClose = true;
    this.socket?.close();
    this.socket = null;
    this.pendingMessages = [];
  }
}