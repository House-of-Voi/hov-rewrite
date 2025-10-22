/**
 * iBuyVoi Widget Integration
 *
 * Opens the iBuyVoi widget in a popup window for USDC deposits
 */

const IBUYVOI_WIDGET_URL = 'https://ibuyvoi.com/widget';

export interface IBuyVoiOptions {
  destination: string; // VOI wallet address
  theme?: 'light' | 'dark' | 'auto';
  minimum?: number; // Minimum purchase in USD
}

/**
 * Build iBuyVoi widget URL with parameters
 */
export function buildIBuyVoiUrl(options: IBuyVoiOptions): string {
  const params = new URLSearchParams({
    destination: options.destination,
    mode: 'popup',
  });

  if (options.theme) {
    params.append('theme', options.theme);
  }

  if (options.minimum) {
    params.append('minimum', options.minimum.toString());
  }

  return `${IBUYVOI_WIDGET_URL}?${params.toString()}`;
}

/**
 * Open iBuyVoi widget in a popup window
 *
 * @param address - VOI wallet address to receive funds
 * @param onClose - Optional callback when popup closes
 * @returns Window reference or null if popup was blocked
 */
export function openIBuyVoiWidget(
  address: string,
  onClose?: () => void
): Window | null {
  const url = buildIBuyVoiUrl({
    destination: address,
    theme: 'dark',
    minimum: 2, // $2 minimum
  });

  // Calculate popup position (centered on screen)
  const width = 400;
  const height = 600;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
    'status=no',
    'toolbar=no',
    'menubar=no',
    'location=no',
  ].join(',');

  // Open popup window
  const popup = window.open(url, 'iBuyVoi', features);

  if (!popup) {
    console.error('Popup was blocked by browser');
    return null;
  }

  // Monitor popup close event
  if (onClose) {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        onClose();
      }
    }, 500);
  }

  // Focus the popup
  popup.focus();

  return popup;
}

/**
 * Check if popup blockers might prevent the widget from opening
 */
export function isPopupBlocked(popup: Window | null): boolean {
  return popup === null || popup.closed || typeof popup.closed === 'undefined';
}
