import {readFileSync} from 'node:fs'
export function clockFields(source){return {clock_boot:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),clock_mono:String(Number(process.hrtime.bigint()/1000000n)),clock_db:String(source)}}
