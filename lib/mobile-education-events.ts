// Global mobile education event system
export interface MobileEducationEvent {
  walletType: 'solana' | 'algorand';
  error?: string;
}

class MobileEducationManager {
  private listeners: Array<(event: MobileEducationEvent) => void> = [];

  subscribe(listener: (event: MobileEducationEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  trigger(event: MobileEducationEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in mobile education listener:', error);
      }
    });
  }
}

export const mobileEducationManager = new MobileEducationManager();
