import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import '@/shared/styles/tokens.css';
import './globals.css';
export const metadata:Metadata={title:'Short-lived sharing',description:'Temporary sharing. Opening a link does not reveal its content.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>;}
