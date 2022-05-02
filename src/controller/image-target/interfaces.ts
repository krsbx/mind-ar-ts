import { ON_UPDATE_EVENT, WORKER_EVENT } from './constant';

export type WorkerEvent = typeof WORKER_EVENT[keyof typeof WORKER_EVENT];

export type OnUpdateEvent = typeof ON_UPDATE_EVENT[keyof typeof ON_UPDATE_EVENT];

export interface IOnUpdate {
  type: typeof ON_UPDATE_EVENT[keyof typeof ON_UPDATE_EVENT];
  targetIndex?: number | null;
  worldMatrix?: number[] | null;
}
