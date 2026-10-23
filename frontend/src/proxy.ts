import {NextRequest,NextResponse} from 'next/server';

// Per-request nonce also reaches Next's renderer via the request CSP header.
export function proxy(request:NextRequest){
 const nonce=Buffer.from(crypto.randomUUID()).toString('base64');
 const policy=`default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`;
 const headers=new Headers(request.headers);
 headers.set('x-nonce',nonce);
 headers.set('Content-Security-Policy',policy);
 const response=NextResponse.next({request:{headers}});
 response.headers.set('Content-Security-Policy',policy);
 response.headers.set('Cache-Control','no-store');
 response.headers.set('Referrer-Policy','no-referrer');
 return response;
}
export const config={matcher:'/((?!_next/static|_next/image|favicon.ico).*)'};
