// Before application modules capture fetch: real response delay, no fabricated API data.
// Host clipboard untouched; controlled copy completion only. Deliberately no OS-clipboard claim.
export default function hooks(){
 if(location.origin!=='https://localhost:3449')return;
 window.t19={posts:0,status:0,csp:0,writes:[],mode:'success',delay:0,everPlain:false,events:[]};
 document.addEventListener('securitypolicyviolation',()=>window.t19.csp++);
 for(const event of ['pagehide','pageshow','freeze','resume','visibilitychange'])addEventListener(event,e=>window.t19.events.push({type:event,persisted:e.persisted??null,visibility:document.visibilityState}));
 const raw=window.fetch.bind(window);window.fetch=async(...args)=>{const url=String(args[0]);if(args[1]?.method==='POST')window.t19.posts++;if(url.endsWith('/status'))window.t19.status++;const response=await raw(...args);if(url.endsWith('/disclosures'))window.t19.lastDisclosureStatus=response.status;if(url.endsWith('/disclosures')&&window.t19.delay)await new Promise(r=>setTimeout(r,window.t19.delay));return response;};
 if(navigator.clipboard)Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:value=>{window.t19.writes.push(value);if(window.t19.mode==='denied')return Promise.reject(Error('controlled denial'));if(window.t19.mode==='pending')return new Promise(resolve=>window.t19.finish=resolve);return Promise.resolve();}});
};
