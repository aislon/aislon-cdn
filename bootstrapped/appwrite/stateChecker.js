// Navigation helpers
const getCurrentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

function shouldRedirect() {
    if (navigationInProgress) return null;
    
    const currentPath = getCurrentPath();
    
    // Skip redirect for paths that should never trigger it
    if (PREVENT_REDIRECT_PATHS?.some(path => currentPath.startsWith(path))) {
        return null;
    }
    
    // Always public paths are accessible regardless of auth state
    if (ALWAYS_PUBLIC_PATHS?.some(path => currentPath.startsWith(path))) {
        return null;
    }

    // Force redirect authenticated users from NO_AUTH_PATHS to DEFAULT_AUTH_PAGE
    if (isUserAuthenticated && NO_AUTH_PATHS?.some(path => 
        currentPath === path || currentPath.startsWith(path)
    )) {
        return DEFAULT_AUTH_PAGE;
    }
    
    // Force redirect unauthenticated users from AUTH_REQUIRED_PATHS
    if (!isUserAuthenticated && AUTH_REQUIRED_PATHS?.some(path => 
        currentPath.startsWith(path)
    )) {
        return DEFAULT_UNAUTH_PAGE;
    }

    // Special case: Authenticated users at index should be redirected
    if (isUserAuthenticated && (currentPath === '/' || currentPath === '/index.html')) {
        return DEFAULT_AUTH_PAGE;
    }

    // Prevent redirect loops
    if (isUserAuthenticated && currentPath === DEFAULT_AUTH_PAGE?.replace(/\/+$/, '')) {
        return null;
    }
    
    if (!isUserAuthenticated && currentPath === DEFAULT_UNAUTH_PAGE?.replace(/\/+$/, '')) {
        return null;
    }
    
    return null;
}

async function handleNavigation() {
    if (!AUTH_CHECK_COMPLETE || navigationInProgress) {
        return false;
    }

    try {
        navigationInProgress = true;
        const redirectTo = shouldRedirect();
        const currentPath = getCurrentPath();
        
        // Handle loading screen
        const loadingDiv = document.getElementById('loadingDiv');
        if (FULL_LOADING_SCREEN && loadingDiv) {
            // Use requestAnimationFrame for smoother transitions
            requestAnimationFrame(() => {
                loadingDiv.style.display = 'none';
                loadingDiv.setAttribute('style', 'display: none !important;');
            });
        }
        
        if (redirectTo && currentPath !== redirectTo.replace(/\/+$/, '')) {
            if (PREVENT_REDIRECT_PATHS?.some(path => 
                currentPath.startsWith(path) || currentPath === path)) {
                return false;
            }
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Navigation] Redirecting to: ${redirectTo}`);
            }
            
            window.location.href = redirectTo;
            return true;
        }
    } catch (error) {
        console.error('[Navigation Error]', error);
    } finally {
        navigationInProgress = false;
    }

    return false;
}

// Initial check on page load with DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (AUTH_CHECK_COMPLETE) {
        handleNavigation();
    }
    checkUser();
});