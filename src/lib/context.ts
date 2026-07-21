import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
    userId?: string;
    username?: string;
}

export const context = new AsyncLocalStorage<RequestContext>();
