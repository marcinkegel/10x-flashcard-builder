// Vite plugin to inject polyfills at the beginning of the worker bundle
export function polyfillPlugin() {
  const polyfillCode = `// Polyfill for MessageChannel (React 19 requirement)
if (typeof MessageChannel === "undefined") {
  class MessagePortPolyfill {
    onmessage = null;
    otherPort = null;
    listeners = new Map();
    started = false;
    messageQueue = [];

    setOtherPort(port) {
      this.otherPort = port;
    }

    postMessage(message) {
      if (!this.otherPort) return;
      if (!this.started) {
        this.messageQueue.push(message);
        return;
      }
      this.deliverMessage(message);
    }

    deliverMessage(message) {
      if (!this.otherPort) return;
      const event = { data: message };
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

    addEventListener(type, listener) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)?.add(listener);
    }

    removeEventListener(type, listener) {
      this.listeners.get(type)?.delete(listener);
    }
  }

  class MessageChannelPolyfill {
    constructor() {
      const port1 = new MessagePortPolyfill();
      const port2 = new MessagePortPolyfill();
      port1.setOtherPort(port2);
      port2.setOtherPort(port1);
      this.port1 = port1;
      this.port2 = port2;
      port1.start();
      port2.start();
    }
  }

  globalThis.MessageChannel = MessageChannelPolyfill;
}

`;

  return {
    name: "polyfill-injector",
    enforce: "post",
    generateBundle(options, bundle) {
      // Inject polyfill into the worker entry point
      for (const [fileName, file] of Object.entries(bundle)) {
        if (
          file.type === "chunk" &&
          (fileName.includes("index.js") || fileName.includes("_worker.js") || fileName.includes("entry"))
        ) {
          // Prepend polyfill to the chunk code
          file.code = polyfillCode + file.code;
        }
      }
    },
  };
}
