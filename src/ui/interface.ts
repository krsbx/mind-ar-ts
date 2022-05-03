import { CONFIRMATION } from './constant';

type UiConfirmation = typeof CONFIRMATION[keyof typeof CONFIRMATION];

export type { UiConfirmation };
