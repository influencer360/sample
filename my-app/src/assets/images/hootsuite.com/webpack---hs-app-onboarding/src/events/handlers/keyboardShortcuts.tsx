import SELECTORS from '../../constants/selectors';

export function maximizeComposer() {
  const element = document.querySelector<HTMLElement>(SELECTORS.minimizedComposer);
  element?.click();
}
