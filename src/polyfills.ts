// Polyfill for MessageChannel in Cloudflare Workers
// React 19 requires MessageChannel which is not available in Workers runtime

if (typeof MessageChannel === "undefined") {
  class MessageChannelPolyfill {
    public port1: {
      onmessage: ((event: { data: unknown }) => void) | null;
      postMessage: (message: unknown) => void;
    };

    public port2: {
      onmessage: ((event: { data: unknown }) => void) | null;
      postMessage: (message: unknown) => void;
    };

    constructor() {
      // Create port1
      this.port1 = {
        onmessage: null,
        postMessage: (message: unknown) => {
          if (this.port2.onmessage) {
            // Use setTimeout to simulate async behavior
            setTimeout(() => {
              this.port2.onmessage?.({ data: message });
            }, 0);
          }
        },
      };

      // Create port2
      this.port2 = {
        onmessage: null,
        postMessage: (message: unknown) => {
          if (this.port1.onmessage) {
            setTimeout(() => {
              this.port1.onmessage?.({ data: message });
            }, 0);
          }
        },
      };
    }
  }

  globalThis.MessageChannel = MessageChannelPolyfill as typeof MessageChannel;
}
