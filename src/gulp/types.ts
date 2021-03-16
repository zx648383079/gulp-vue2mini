import * as vinyl from 'vinyl';

export type transformCallback = (error?: Error | undefined, data?: vinyl) => void;
