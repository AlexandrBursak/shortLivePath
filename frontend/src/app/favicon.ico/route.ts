export function GET(){
 return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="black"/><path d="M10 8h12v4H10zm0 6h12v4H10zm0 6h8v4h-8z" fill="white"/></svg>',{headers:{'Content-Type':'image/svg+xml','Cache-Control':'no-store'}});
}
