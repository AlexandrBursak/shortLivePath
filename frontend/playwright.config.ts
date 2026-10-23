import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/e2e', workers:1, reporter:'list', use:{baseURL:process.env.BASE_URL ?? 'http://127.0.0.1:3304',viewport:{width:360,height:800},screenshot:'off',trace:'off',video:'off'}, projects:[{name:'chromium',use:{browserName:'chromium'}}]});
