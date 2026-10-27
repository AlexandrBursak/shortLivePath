import type {ReactNode} from 'react';
import {ThemeControl} from './ThemeControl';
// Same order, markup and icons (lucide) on every RexSoft service so the header never shifts.
function Icon({children}:{children:ReactNode}){return <svg className="serviceIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;}
const services=[
 {href:'https://passgen.rexsoftproduction.com/',label:'Password Generator',current:false,icon:<Icon><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></Icon>},
 {href:'https://markdown-convertor.rexsoftproduction.com/',label:'Markdown to HTML',current:false,icon:<Icon><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></Icon>},
 {href:'https://snap-link.rexsoftproduction.com/',label:'Snap Link',current:true,icon:<Icon><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>},
];
export function ServiceHeader(){
 return <header className="serviceHeader"><div className="serviceHeaderInner"><nav aria-label="RexSoft services"><ul className="serviceNav">{services.map(({href,label,current,icon})=><li key={href}><a className="serviceLink" href={href} aria-current={current?'page':undefined}>{icon}{label}</a></li>)}</ul></nav><ThemeControl/></div></header>;
}
