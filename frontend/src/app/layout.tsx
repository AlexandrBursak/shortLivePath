import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {headers} from 'next/headers';
import '@/shared/styles/tokens.css';
import './globals.css';
import {themeBootScript} from '@/shared/lib/theme_preference';
import {ServiceHeader} from '@/view/components/ServiceHeader';
export const metadata:Metadata={title:'Short-lived sharing',description:'Temporary sharing. Opening a link does not reveal its content.',robots:{index:false,follow:false}};
// Nonce CSP requires request-time rendering, never a cached nonce-less shell.
export const dynamic='force-dynamic';
// The nonced boot script sets data-theme before first paint, so the html attribute differs from the server render.
export default async function RootLayout({children}:{children:ReactNode}){
 const nonce=(await headers()).get('x-nonce') ?? undefined;
 return <html lang="en" suppressHydrationWarning><head><script nonce={nonce} dangerouslySetInnerHTML={{__html:themeBootScript}}/></head><body><ServiceHeader/>{children}</body></html>;
}
