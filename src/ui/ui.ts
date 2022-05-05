import './ui.scss';
import loadingHTML from './loading.html?raw';
import compatibilityHTML from './compatibility.html?raw';
import scanningHTML from './scanning.html?raw';
import { Helper } from '../libs';

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
  }) {
    if (uiLoading === 'yes') this.loadingModal = this._loadHTML(loadingHTML);
    else this.loadingModal = document.querySelector(uiLoading);

    if (uiError === 'yes') this.compatibilityModal = this._loadHTML(compatibilityHTML);
    else this.compatibilityModal = document.querySelector(uiError);

    if (uiScanning === 'yes') this.scanningMask = this._loadHTML(scanningHTML);
    else this.scanningMask = document.querySelector(uiScanning);

    this.hideLoading();
    this.hideCompatibility();
    this.hideScanning();
  }

  showLoading() {
    if (!this.loadingModal) return;
    this.loadingModal.classList.remove('hidden');
  }
  hideLoading() {
    if (!this.loadingModal) return;
    this.loadingModal.classList.add('hidden');
  }
  showCompatibility() {
    if (!this.compatibilityModal) return;
    this.compatibilityModal.classList.remove('hidden');
  }
  hideCompatibility() {
    if (!this.compatibilityModal) return;
    this.compatibilityModal.classList.add('hidden');
  }
  showScanning() {
    if (!this.scanningMask) return;
    this.scanningMask.classList.remove('hidden');
  }
  hideScanning() {
    if (!this.scanningMask) return;
    this.scanningMask.classList.add('hidden');
  }

  _loadHTML(html: string) {
    const e = Helper.castTo<HTMLTemplateElement>(document.createElement('template'));
    e.innerHTML = html.trim();

    const rootNode = e.content.firstChild as ChildNode;
    document.getElementsByTagName('body')[0].appendChild(rootNode);

    return rootNode as HTMLElement;
  }
}

export { UI };
