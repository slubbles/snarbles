/**
 * Deep Link Generation for Mobile Wallet Apps
 * Only used on mobile devices for wallet app browser navigation
 */

export const generateWalletDeepLink = (walletType: 'solana' | 'algorand', currentUrl?: string): string => {
  const url = currentUrl || window.location.href;
  const encodedUrl = encodeURIComponent(url);
  
  switch (walletType) {
    case 'solana':
      // Phantom app deep link to browse URL
      return `https://phantom.app/ul/browse/${url}`;
      
    case 'algorand':
      // Pera Wallet deep link
      return `https://perawallet.app/wc?uri=${encodedUrl}`;
      
    default:
      return url;
  }
};

export const getWalletDownloadUrl = (walletType: 'solana' | 'algorand'): string => {
  switch (walletType) {
    case 'solana':
      return 'https://phantom.app/download';
    case 'algorand':
      return 'https://perawallet.app/download/';
    default:
      return '#';
  }
};

export const getWalletAppName = (walletType: 'solana' | 'algorand'): string => {
  switch (walletType) {
    case 'solana':
      return 'Phantom';
    case 'algorand':
      return 'Pera Wallet';
    default:
      return 'Wallet';
  }
};
