const services=[
 {href:'https://snap-link.rexsoftproduction.com/',label:'Snap Link',current:true},
 {href:'https://passgen.rexsoftproduction.com/',label:'Password Generator',current:false},
 {href:'https://markdown-convertor.rexsoftproduction.com/',label:'Markdown to HTML',current:false},
] as const;
export function ServiceNavigation(){
 return <header className="serviceHeader"><nav aria-label="RexSoft services"><ul className="serviceNav">{services.map(({href,label,current})=><li key={href}><a href={href} aria-current={current?'page':undefined}>{label}</a></li>)}</ul></nav></header>;
}
