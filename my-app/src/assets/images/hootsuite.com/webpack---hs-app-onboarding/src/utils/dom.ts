export function isElementVisible(element: HTMLElement | null): boolean {
  if (element) {
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  }

  return false;
}

type WaitForElementOptions = {
  interval?: number;
  timeout?: number;
  shouldReturnAll?: boolean;
};

export function waitForElement(
  selector: string,
  { interval = 50, timeout = 5000, shouldReturnAll = false }: WaitForElementOptions = {},
): Promise<Element | Element[]> {
  return new Promise((resolve, reject) => {
    const findElement = (timeRemaining: number) => {
      const result = Array.from(document.querySelectorAll(selector));

      if (result.length > 0) {
        resolve(shouldReturnAll ? result : result[0]);
      } else {
        if (timeRemaining > 0) {
          setTimeout(() => findElement(timeRemaining - interval), interval);
        } else {
          reject(`Could not find element matching '${selector}'.`);
        }
      }
    };

    findElement(timeout);
  });
}
