import { ON_UPDATE_EVENT, WORKER_EVENT } from './constant';

type WorkerEvent = typeof WORKER_EVENT[keyof typeof WORKER_EVENT];

type OnUpdateEvent = typeof ON_UPDATE_EVENT[keyof typeof ON_UPDATE_EVENT];

interface IOnUpdate {
  type: typeof ON_UPDATE_EVENT[keyof typeof ON_UPDATE_EVENT];
  targetIndex?: number | null;
  worldMatrix?: number[] | null;
}

export type { WorkerEvent, OnUpdateEvent, IOnUpdate };
