// Loaded only on a direct navigation or a click from the Garage İstanbul hub.
window.GarageHubSSO = Object.freeze({
  waitForToken() {
    if (!window.opener) return Promise.resolve("");
    const hubOrigin = "https://api.scheax.com.tr";
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, "0")).join("");
    return new Promise(resolve => {
      let done = false;
      const finish = value => { if(done)return; done=true; clearTimeout(timer); window.removeEventListener("message",receive); resolve(value); };
      const receive = event => {
        if(event.source!==window.opener || event.origin!==hubOrigin || event.data?.type!=="garage-hub:session" || event.data.nonce!==nonce) return;
        finish(typeof event.data.token==="string" ? event.data.token : "");
      };
      const timer = setTimeout(()=>finish(""),4000);
      window.addEventListener("message",receive);
      window.opener.postMessage({type:"garage-hub:ready",nonce},hubOrigin);
    });
  }
});
