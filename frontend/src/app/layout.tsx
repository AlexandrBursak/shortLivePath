import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import '@/shared/styles/tokens.css';
import './globals.css';
import {ServiceNavigation} from '@/view/components/ServiceNavigation';
export const metadata:Metadata={title:'Short-lived sharing',description:'Temporary sharing. Opening a link does not reveal its content.',robots:{index:false,follow:false}};
// Nonce CSP requires request-time rendering, never a cached nonce-less shell.
export const dynamic='force-dynamic';
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><ServiceNavigation/>{children}</body></html>;}
