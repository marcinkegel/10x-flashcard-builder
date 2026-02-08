// Polyfill for MessageChannel in Cloudflare Workers
// React 19 requires MessageChannel which is not available in Workers runtime

if (typeof MessageChannel === 'undefined') {
  class MessageChannelPolyfill {
    constructor() {
      this.port1 = {
        onmessage: null,
        postMessage: (message) => {
          if (this.port2.onmessage) {
            // Use setTimeout to simulate async behavior
            setTimeout(() => {
              this.port2.onmessage({ data: message });
            }, 0);
          }
        },
      };
      this.port2 = {
        onmessage: null,
        postMessage: (message) => {
          if (this.port1.onmessage) {
            setTimeout(() => {
              this.port1.onmessage({ data: message });
            }, 0);
          }
        },
      };
    }
  }

  globalThis.MessageChannel = MessageChannelPolyfill;
}
