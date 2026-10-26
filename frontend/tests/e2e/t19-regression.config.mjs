// Mount at /home/node/app/t19.config.mjs in the owned regression container.
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',workers:1,reporter:'list',use:{baseURL:'https://localhost:3449',ignoreHTTPSErrors:true,viewport:{width:360,height:800},screenshot:'off',trace:'off',video:'off'},projects:[{name:'chromium',use:{browserName:'chromium'}}]});
