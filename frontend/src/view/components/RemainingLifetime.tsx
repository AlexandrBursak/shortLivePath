export function RemainingLifetime({remaining,expiresAt}:{remaining:number;expiresAt:string}){
 const seconds=Math.max(0,Math.ceil(remaining/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;
 const display=[hours,minutes,rest].map(x=>String(x).padStart(2,'0')).join(':');
 return <div><p tabIndex={0} aria-label={`Remaining lifetime ${display}`}>Remaining <span>{display}</span></p><p>Expires <time dateTime={expiresAt}>{new Date(expiresAt).toISOString().replace('T',' ').replace('.000Z',' UTC').replace('Z',' UTC')}</time></p></div>;
}
