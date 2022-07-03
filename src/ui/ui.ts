import './ui.scss';
import loadingHTML from './loading.html?raw';
import compatibilityHTML from './compatibility.html?raw';
import scanningHTML from './scanning.html?raw';
import { Helper } from '../libs';
import { AR_ELEMENT_TAG, CONFIRMATION, HIDDEN_CLASS_NAME } from '../utils/constant';

class UI {
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
    zIndex?: number;
  }) {
    if (uiLoading === CONFIRMATION.YES) this.loadingModal = this._loadHTML(loadingHTML);
    else this.loadingModal = document.querySelector(uiLoading);

    if (uiError === CONFIRMATION.YES) this.compatibilityModal = this._loadHTML(compatibilityHTML);
    else this.compatibilityModal = document.querySelector(uiError);

    if (uiScanning === CONFIRMATION.YES) this.scanningMask = this._loadHTML(scanningHTML);
    else this.scanningMask = document.querySelector(uiScanning);

    this.hideLoading();
    this.hideCompatibility();
    this.hideScanning();
  }

  public showLoading() {
    if (!this.loadingModal) return;

    this.loadingModal.classList.remove(HIDDEN_CLASS_NAME);
  }

  public hideLoading() {
    if (!this.loadingModal) return;

    this.loadingModal.classList.add(HIDDEN_CLASS_NAME);
  }

  public showCompatibility() {
    if (!this.compatibilityModal) return;

    this.compatibilityModal.classList.remove(HIDDEN_CLASS_NAME);
  }

  public hideCompatibility() {
    if (!this.compatibilityModal) return;

    this.compatibilityModal.classList.add(HIDDEN_CLASS_NAME);
  }

  public showScanning() {
    if (!this.scanningMask) return;
    this.scanningMask.classList.remove(HIDDEN_CLASS_NAME);
  }

  public hideScanning() {
    if (!this.scanningMask) return;

    this.scanningMask.classList.add(HIDDEN_CLASS_NAME);
  }

  private _loadHTML(html: string) {
    const e = Helper.castTo<HTMLTemplateElement>(document.createElement('template'));
    e.innerHTML = html.trim();

    const rootNode = e.content.firstChild as ChildNode;
    document.querySelector(AR_ELEMENT_TAG.A_SCENE).appendChild(rootNode);

    return rootNode as HTMLElement;
  }
}

export default UI;
