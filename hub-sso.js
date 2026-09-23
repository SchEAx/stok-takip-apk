// Loaded only on a direct navigation or a click from the Garage İstanbul hub.
window.GarageHubSSO = Object.freeze({
  waitForToken() {
    const hubWindow = window.parent !== window ? window.parent : window.opener;
    if (!hubWindow) return Promise.resolve("");
    const hubOrigin = "https://hub-three-ashen.vercel.app";
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, "0")).join("");
    return new Promise(resolve => {
      let done = false;
      const finish = value => { if(done)return; done=true; clearTimeout(timer); window.removeEventListener("message",receive); resolve(value); };
      const receive = event => {
        if(event.source!==hubWindow || event.origin!==hubOrigin || event.data?.type!=="garage-hub:session" || event.data.nonce!==nonce) return;
        finish(typeof event.data.token==="string" ? event.data.token : "");
      };
      const timer = setTimeout(()=>finish(""),4000);
      window.addEventListener("message",receive);
      hubWindow.postMessage({type:"garage-hub:ready",nonce},hubOrigin);
    });
  }
});
