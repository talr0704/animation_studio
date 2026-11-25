import {createProgressStore, profileOf} from './state.js';
export const progressStore = createProgressStore();
export const actionId = prefix => `${prefix}:${globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random().toString(36).slice(2)}`;
export const readProfile = () => profileOf(progressStore.read());
