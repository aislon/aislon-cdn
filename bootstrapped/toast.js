/*
 * Toast Notification System
 * 
 * showToast(options)
 *   Displays a toast notification
 *   - options.heading: Toast heading (default: '')
 *   - options.message: Toast message (default: '')
 *   - options.duration: Duration in ms (default: 3000, 0 for persistent)
 *   - options.type: Toast type ('success' | 'error' | 'loading' | 'default')
 *   - options.iconSrc: Custom icon URL (overrides type icon)
 * 
 * showLoadingToast(toastId, options) 
 *   Shows/updates a loading toast with given ID
 *   - toastId: Unique identifier (required)
 *   - options: Same as showToast + loadingHeading/loadingMessage
 * 
 * updateLoadingToast(toastId, type, options)
 *   Updates loading toast status
 *   - toastId: Toast identifier
 *   - type: Type of toast to update to
 *   - options: Customization options
 */

const TOAST_CONFIG = {
    MOBILE_BREAKPOINT: 768,
    ANIMATION_MS: 200,
    DEFAULT_DURATION: 3000,
    GAP: 4,
    TYPES: {
        DEFAULT: 'default',
        SUCCESS: 'success',
        ERROR: 'error',
        LOADING: 'loading'
    },
    ICONS: {
        success: 'icons/toast/greenSuccess.svg',
        error: 'icons/toast/redError.svg',
        loading: 'icons/toast/loadingSpinner.svg'
    },
    SELECTORS: {
        CONTAINER: '#toastContainer',
        BASE_TOAST: '#baseToast',
        ICON: '#toastIcon',
        HEADING: '#toastHeading',
        DESCRIPTION: '#toastDescription'
    }
};

// Add required styles
document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
        .toast-enter { opacity: 0; transform: translateY(-100%); }
        .toast-enter-active { opacity: 1; transform: translateY(0); transition: all ${TOAST_CONFIG.ANIMATION_MS}ms ease-out; }
        .toast-exit { opacity: 1; }
        .toast-exit-active { opacity: 0; transform: translateY(-20px); transition: all ${TOAST_CONFIG.ANIMATION_MS}ms ease-out; }
        @media (max-width: ${TOAST_CONFIG.MOBILE_BREAKPOINT}px) {
            .toast-enter { transform: translateX(-50%) translateY(-100%); }
            .toast-enter-active { transform: translateX(-50%) translateY(0); }
            .toast-exit-active { transform: translateX(-50%) translateY(-20px); }
        }
        .rotatingIcon {
            animation: rotate 1s linear infinite;
        }
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `
}));

const loadingToasts = new Map();

const getOrCreateContainer = () => {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 1050;';
        document.body.appendChild(container);
    }
    return container;
};

const createToastElement = ({heading = '', message = '', type = TOAST_CONFIG.TYPES.DEFAULT, iconSrc = null} = {}) => {
    const baseToast = document.querySelector(TOAST_CONFIG.SELECTORS.BASE_TOAST);
    if (!baseToast) return null;

    const toast = baseToast.cloneNode(true);
    toast.id = `toast-${Date.now()}`;
    toast.className = 'toast fade show toast-enter';
    toast.style.display = 'block';
    toast.style.position = 'absolute';
    toast.style.width = '350px';

    const iconEl = toast.querySelector(TOAST_CONFIG.SELECTORS.ICON);
    const headingEl = toast.querySelector(TOAST_CONFIG.SELECTORS.HEADING);
    const descEl = toast.querySelector(TOAST_CONFIG.SELECTORS.DESCRIPTION);

    // Handle icon visibility and source
    if (iconEl) {
        const icon = iconSrc || TOAST_CONFIG.ICONS[type];
        if (icon) {
            iconEl.src = icon;
            iconEl.style.display = 'inline';
            if (type === TOAST_CONFIG.TYPES.LOADING) {
                iconEl.classList.add('rotatingIcon');
            }
        } else {
            iconEl.remove(); // Remove icon element if no icon should be shown
        }
    }

    if (headingEl) headingEl.textContent = heading;
    if (descEl) descEl.textContent = message;

    return toast;
};

const removeToast = (toast, immediate = false) => {
    return new Promise(resolve => {
        if (immediate) {
            toast.remove();
            positionToasts();
            resolve();
            return;
        }
        
        toast.classList.replace('toast-enter-active', 'toast-exit');
        toast.classList.add('toast-exit-active');
        
        setTimeout(() => {
            toast.remove();
            positionToasts();
            resolve();
        }, TOAST_CONFIG.ANIMATION_MS);
    });
};

const positionToasts = () => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const isMobile = window.innerWidth <= TOAST_CONFIG.MOBILE_BREAKPOINT;
    let offset = 0;
    
    Array.from(container.children).forEach(toast => {
        toast.style.position = 'absolute';
        toast.style.left = isMobile ? '50%' : 'auto';
        toast.style.right = isMobile ? 'auto' : '0';
        toast.style.transform = isMobile
            ? `translateX(-50%) translateY(${offset}px)`
            : `translateY(${offset}px)`;
        offset += toast.offsetHeight + TOAST_CONFIG.GAP;
    });
};

function showToast(options = {}) {
    const container = getOrCreateContainer();
    const toast = createToastElement(options);
    if (!toast) return;
    
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-enter-active');
        positionToasts();
    });

    if (options.duration !== 0) {
        setTimeout(() => removeToast(toast), options.duration || TOAST_CONFIG.DEFAULT_DURATION);
    }

    if (!options.isLoading) {
        toast.addEventListener('click', () => removeToast(toast), { once: true });
    }

    return toast;
}

function showLoadingToast(toastId, options = {}) {
    if (!toastId) throw new Error('Toast ID is required');
    
    document.querySelectorAll(`[data-toast-id="${toastId}"]`).forEach(t => removeToast(t, true));
    
    const toast = showToast({
        heading: options.loadingHeading || 'Loading...',
        message: options.loadingMessage || 'Please wait...',
        type: TOAST_CONFIG.TYPES.LOADING,
        isLoading: true,
        duration: 0,
        ...options
    });
    
    if (toast) {
        toast.dataset.toastId = toastId;
        loadingToasts.set(toastId, toast);
    }
    return toast;
}

function updateLoadingToast(toastId, type = TOAST_CONFIG.TYPES.SUCCESS, options = {}) {
    const toast = loadingToasts.get(toastId);
    if (!toast) return;

    const iconEl = toast.querySelector(TOAST_CONFIG.SELECTORS.ICON);
    const headingEl = toast.querySelector(TOAST_CONFIG.SELECTORS.HEADING);
    const descEl = toast.querySelector(TOAST_CONFIG.SELECTORS.DESCRIPTION);

    if (iconEl) {
        iconEl.src = TOAST_CONFIG.ICONS[type];
        iconEl.classList.remove('rotatingIcon');
    }
    
    if (headingEl) {
        headingEl.textContent = options.heading || 
            (type === TOAST_CONFIG.TYPES.SUCCESS ? 'Success!' : 'Error');
    }
    if (descEl) {
        descEl.textContent = options.message || 
            (type === TOAST_CONFIG.TYPES.SUCCESS ? 'Operation completed successfully.' : 'Something went wrong.');
    }

    setTimeout(() => {
        removeToast(toast).then(() => loadingToasts.delete(toastId));
    }, options.duration || TOAST_CONFIG.DEFAULT_DURATION);
}

// Debounced window resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(positionToasts, 150);
});