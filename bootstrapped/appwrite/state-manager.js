
// Core state
let isUserAuthenticated = false;
let navigationInProgress = false;
let userDocument = null;


/**
 * Fetches authenticated user's document with 15-min cache strategy.
 * @returns {Promise<Object|null>} User document if found, null otherwise
 * @throws {Error} If database operation fails
 */

async function checkUser() {
    try {
        const accountResponse = await account.get();
        isUserAuthenticated = true; // Set auth state if account.get() succeeds
        console.log('USER AUTHENTICATED')
        
        AUTH_CHECK_COMPLETE = true;
        // Handle redirection immediately after authentication state change
        if (handleNavigation()) {
            return null; // Exit if redirect happens
        }
        
        const storedData = JSON.parse(sessionStorage.getItem('userData'));
        
        if (storedData?.userId === accountResponse.$id && 
            (new Date() - new Date(storedData.timestamp)) < 900000) { // 15 minutes in milliseconds
            userDocument = storedData.document || null;
            updateUI();  // Update UI
            shouldRedirect(); // Check if redirect needed after auth
            return storedData.document;
        }

        let attempts = 0;
        const maxAttempts = 5;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        while (attempts < maxAttempts) {
            console.log('Fetching user data.. ' + attempts);
            try {
                userDocument = await databases.getDocument('userDB', 'userData', accountResponse.$id);
                break; // Exit loop if successful
            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw error; // Rethrow error after max attempts
                }
                await delay(2000); // Wait 1 second before retrying
            }
        }

        sessionStorage.setItem('userData', JSON.stringify({
            document: userDocument,
            timestamp: new Date().toISOString(),
            userId: accountResponse.$id
        }));

        updateUI();  // Update UI
        shouldRedirect(); // Check if redirect needed after auth
        return userDocument;
    } catch (error) {
        isUserAuthenticated = false; // Reset auth state on error
        sessionStorage.removeItem('userData');
        
        AUTH_CHECK_COMPLETE = true;
        // Handle redirection for unauthenticated state
        if (handleNavigation()) {
            return null;
        }
        
        if (error.response?.code === 401) {
            //showToast({ message: 'No User Logged In' });

            if (shouldRedirect()) { // Check if redirect needed
                return null;
            }
        } else {
            console.error('Error fetching user data:', error);
        }
        return null;
    } finally {
        updateUI(); // Always update UI
    }
}
// checkUser();





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





/**
 * Updates UI elements with matching class names using values from a user document.
 * Handles text elements, inputs, images, and avatar generation.
 * User data object containing fields like userFullName, email, etc.
 */
function updateUI() {
    // Handle authentication-based visibility
    const nonAuthElements = document.getElementsByClassName('nonAuthOnly');
    Array.from(nonAuthElements).forEach(element => {
        // Set display through CSS class instead
        if (isUserAuthenticated) {
            element.classList.add('force-hide');
            element.classList.remove('force-show');
        } else {
            element.classList.add('force-show');
            element.classList.remove('force-hide');
        }
    });
    
    const authElements = document.getElementsByClassName('authOnly');
    Array.from(authElements).forEach(element => {
        if (isUserAuthenticated) {
            element.classList.add('force-show');
            element.classList.remove('force-hide');
        } else {
            element.classList.add('force-hide');
            element.classList.remove('force-show');
        }
    });

    // Only update user data if authenticated and userDocument exists
    if (isUserAuthenticated && userDocument) {
        const uiMapping = {
            '.user-name': userDocument.userFullName || userDocument.email || '',
            '.user-email': userDocument.email || '',
            '.user-phone': userDocument.phone || '',
        };

        Object.entries(uiMapping).forEach(([className, value]) => {
            const elements = document.getElementsByClassName(className.replace('.', ''));
            Array.from(elements).forEach(element => {
                if (element.tagName === 'INPUT') {
                    element.value = value;
                } else if (element.tagName === 'IMG') {
                    element.src = value;
                } else {
                    element.textContent = value;
                }
            });
        });

        // Handle avatar
        if (userDocument.userFullName || userDocument.email) {
            const avatarName = userDocument.userFullName || userDocument.email;
            const result = avatars.getInitials(avatarName, 80, 80, AVATAR_BACKGROUND_COLOR);
            
            const avatarElements = document.getElementsByClassName('user-avatar');
            Array.from(avatarElements).forEach(element => {
                element.src = result;
            });
        }
    }
}
