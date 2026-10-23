export function observeLifecycle(page:EventTarget & {visibilityState:string},host:EventTarget,conceal:()=>void,revalidate:()=>void):()=>void{
 const hidden=()=>conceal();
 const returned=()=>{conceal();if(page.visibilityState==='visible')revalidate();};
 const visibility=()=>{if(page.visibilityState==='hidden')conceal();else returned();};
 const events:[EventTarget,string,EventListener][]=[[page,'visibilitychange',visibility],[page,'freeze',hidden],[host,'pagehide',hidden],[host,'pageshow',returned],[host,'focus',returned]];
 for(const [target,event,fn] of events)target.addEventListener(event,fn);
 return ()=>{for(const [target,event,fn] of events)target.removeEventListener(event,fn);};
}
