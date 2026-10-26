const net=require('node:net');
// Test-only TCP forwarding preserves end-to-end TLS and the exact localhost origin.
const server=net.createServer(client=>{const upstream=net.connect(process.env.UPSTREAM_PORT?Number(process.env.UPSTREAM_PORT):8443,process.env.UPSTREAM_HOST??'proxy');client.pipe(upstream).pipe(client);upstream.on('error',()=>client.destroy());client.on('error',()=>upstream.destroy());});
server.listen(3447,'127.0.0.1',async()=>{try{if(process.env.REGRESSION){const child=require('node:child_process').spawn('pnpm',['exec','playwright','test','--config','t17.config.ts'],{stdio:'inherit'});child.on('exit',code=>{server.close();process.exit(code??1);});return;}await import('/smoke/https-smoke.mjs');server.close();process.exit(0);}catch(e){console.error(e);process.exit(1);}});
