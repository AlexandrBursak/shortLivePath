import type {NextConfig} from 'next';
const config:NextConfig={output:'standalone',poweredByHeader:false,async headers(){return [{source:'/:path*',headers:[{key:'Cache-Control',value:'no-store, max-age=0'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Content-Type-Options',value:'nosniff'}]}];}};
export default config;
