declare class UI {
  private loadingModal: HTMLElement;
  private compatibilityModal: HTMLElement;
  private scanningMask: HTMLElement;
  private zIndex: number;

  constructor({
    uiLoading,
    uiScanning,
    uiError,
    zIndex,
  }: {
    uiLoading: string;
    uiScanning: string;
    uiError: string;
    zIndex?: number;
  });
  showLoading(): void;
  hideLoading(): void;
  showCompatibility(): void;
  hideCompatibility(): void;
  showScanning(): void;
  hideScanning(): void;
  _loadHTML(html: string): HTMLElement;
}

export default UI;
