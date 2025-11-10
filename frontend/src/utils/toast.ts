// Simple toast notification service
class ToastService {
  private container: HTMLDivElement | null = null;

  private createContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-[9999] space-y-2';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private createToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const container = this.createContainer();
    
    const toast = document.createElement('div');
    const baseClasses = 'px-6 py-4 rounded-lg shadow-lg text-white font-medium max-w-sm opacity-0 transform translate-x-full transition-all duration-300 ease-out';
    
    const typeClasses = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      info: 'bg-blue-600'
    };
    
    toast.className = `${baseClasses} ${typeClasses[type]}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('opacity-0', 'translate-x-full');
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
        // Remove container if empty
        if (container.children.length === 0) {
          document.body.removeChild(container);
          this.container = null;
        }
      }, 300);
    }, 3000);
  }

  success(message: string) {
    this.createToast(message, 'success');
  }

  error(message: string) {
    this.createToast(message, 'error');
  }

  info(message: string) {
    this.createToast(message, 'info');
  }
}

// Create singleton instance
const toast = new ToastService();

export default toast;