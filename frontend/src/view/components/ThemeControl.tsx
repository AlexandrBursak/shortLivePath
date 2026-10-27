'use client';
import {useEffect,useState} from 'react';
import {readThemePreference,resolveTheme,writeThemePreference,type ThemePreference} from '@/shared/lib/theme_preference';
const options:{value:ThemePreference;label:string}[]=[{value:'system',label:'System'},{value:'light',label:'Light'},{value:'dark',label:'Dark'}];
const darkQuery='(prefers-color-scheme: dark)';
function applyTheme(preference:ThemePreference){document.documentElement.dataset.theme=resolveTheme(preference,window.matchMedia?.(darkQuery).matches ?? false);}
export function ThemeControl(){
 const [preference,setPreference]=useState<ThemePreference>('system');
 // Read after hydration: the server cannot know the stored choice.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{setPreference(readThemePreference());},[]);
 useEffect(()=>{
  if(preference!=='system' || !window.matchMedia) return;
  const query=window.matchMedia(darkQuery);const follow=()=>applyTheme('system');
  query.addEventListener('change',follow);return ()=>query.removeEventListener('change',follow);
 },[preference]);
 const choose=(next:ThemePreference)=>{setPreference(next);writeThemePreference(next);applyTheme(next);};
 return <fieldset className="themeControl"><legend className="visuallyHidden">Theme</legend><div className="themeOptions">{options.map(({value,label})=><label key={value} className="themeOption"><input type="radio" name="theme" checked={preference===value} onChange={()=>choose(value)}/>{label}</label>)}</div></fieldset>;
}
