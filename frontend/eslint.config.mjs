import vitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import layers from './eslint.layers.mjs';
const layerRules=layers.map(layer=>({files:layer.files,settings:layer.settings,rules:layer.rules}));
const config=[...vitals,...typescript,...layerRules,{ignores:['.next/**','test-results/**','next-env.d.ts']}];
export default config;
