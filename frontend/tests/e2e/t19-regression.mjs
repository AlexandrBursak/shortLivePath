import net from 'node:net';import {spawn} from 'node:child_process';
// Owned container loopback tunnel preserves actual HTTPS and original public origin.
const server=net.createServer(c=>{const u=net.connect(8443,'proxy');c.pipe(u).pipe(c);u.on('error',()=>c.destroy());c.on('error',()=>u.destroy());});
server.listen(3449,'127.0.0.1',()=>{const child=spawn('pnpm',['exec','playwright','test','--config','t19.config.mjs'],{stdio:'inherit'});child.on('exit',code=>{server.close();process.exit(code??1);});});
