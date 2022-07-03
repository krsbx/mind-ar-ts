declare class UI {
  private loadingModal: HTMLElement;
  private compatibilityModal: HTMLElement;
  private scanningMask: HTMLElement;

  constructor({
    uiLoading,
    uiScanning,
    uiError,
  }: {
    uiLoading: string;
    uiScanning: string;
    uiError: string;
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
