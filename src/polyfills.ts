// Polyfill for MessageChannel in Cloudflare Workers
// React 19 requires MessageChannel which is not available in Workers runtime

if (typeof MessageChannel === "undefined") {
  interface MessageEvent {
    data: unknown;
  }

  interface MessagePort {
    onmessage: ((event: MessageEvent) => void) | null;
    postMessage: (message: unknown) => void;
    start: () => void;
    close: () => void;
    addEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
    removeEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  }

  class MessagePortPolyfill implements MessagePort {
    onmessage: ((event: MessageEvent) => void) | null = null;
    private otherPort: MessagePortPolyfill | null = null;
    private listeners = new Map<string, Set<(event: MessageEvent) => void>>();
    private started = false;
    private messageQueue: unknown[] = [];

    setOtherPort(port: MessagePortPolyfill) {
      this.otherPort = port;
    }

    postMessage(message: unknown) {
      if (!this.otherPort) return;

      // Queue messages until start() is called
      if (!this.started) {
        this.messageQueue.push(message);
        return;
      }

      this.deliverMessage(message);
    }

    private deliverMessage(message: unknown) {
      if (!this.otherPort) return;

      const event: MessageEvent = { data: message };

      // Use queueMicrotask for proper async behavior (similar to MessageChannel)
      queueMicrotask(() => {
        if (this.otherPort?.onmessage) {
          this.otherPort.onmessage(event);
        }

        const listeners = this.otherPort?.listeners.get("message");
        if (listeners) {
          listeners.forEach((listener) => listener(event));
        }
      });
    }

    start() {
      if (this.started) return;
      this.started = true;

      // Deliver queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.deliverMessage(message);
      }
    }

    close() {
      this.onmessage = null;
      this.otherPort = null;
      this.listeners.clear();
      this.messageQueue = [];
    }

    addEventListener(type: string, listener: (event: MessageEvent) => void) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)?.add(listener);
    }

    removeEventListener(type: string, listener: (event: MessageEvent) => void) {
      this.listeners.get(type)?.delete(listener);
    }
  }

  class MessageChannelPolyfill {
    public port1: MessagePort;
    public port2: MessagePort;

    constructor() {
      const port1 = new MessagePortPolyfill();
      const port2 = new MessagePortPolyfill();

      port1.setOtherPort(port2);
      port2.setOtherPort(port1);

      this.port1 = port1;
      this.port2 = port2;

      // Auto-start ports (MessageChannel behavior)
      port1.start();
      port2.start();
    }
  }

  // @ts-expect-error - Polyfilling global
  globalThis.MessageChannel = MessageChannelPolyfill;
}
