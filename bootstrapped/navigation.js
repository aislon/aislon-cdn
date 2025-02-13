/**
 * Navigation System for Bootstrap 5 and HTMX Integration
 * ===================================================
 * 
 * A comprehensive navigation management system that handles:
 * - URL-based navigation states
 * - Bootstrap modal/offcanvas activation via URL parameters
 * - HTMX navigation integration
 * - Toggle functionality for modals/offcanvas
 * 
 * Button Attributes:
 * -----------------
 * data-nav-type: "htmx" | "parameter"
 *   - htmx: URL path based activation
 *   - parameter: URL parameter based activation
 * 
 * data-active-class: string (default: "active")
 *   CSS class applied when button is active
 * 
 * data-nav-path: string
 *   - For htmx: URL path to match (e.g., "/about")
 *   - For parameter: Parameter to toggle (e.g., "?modal=login")
 * 
 * data-bs-target: string
 *   Bootstrap component selector (e.g., "#loginModal")
 */

(function() {
    'use strict';

    const navButtons = document.querySelectorAll('[data-nav-type]');
    const DEBUG = false;
    
    // Core initialization
    function init() {
        try {
            setupBootstrapListeners();
            setupEventListeners();
            checkUrlParameters();
            updateAllButtons(); // Initial update
        } catch (error) {
            console.error('Navigation system initialization failed:', error);
        }
    }

    // Setup global Bootstrap component listeners
    function setupBootstrapListeners() {
        // Listen for any modal being hidden
        document.addEventListener('hidden.bs.modal', (event) => {
            const modalId = event.target.id;
            const relatedButton = findRelatedButton('modal', modalId);
            if (relatedButton) {
                removeUrlParameter('modal');
                updateAllButtons();
            }
        });

        // Listen for any offcanvas being hidden
        document.addEventListener('hidden.bs.offcanvas', (event) => {
            const offcanvasId = event.target.id;
            const relatedButton = findRelatedButton('offcanvas', offcanvasId);
            if (relatedButton) {
                removeUrlParameter('offcanvas');
                updateAllButtons();
            }
        });
    }

    // Find button related to a Bootstrap component
    function findRelatedButton(type, componentId) {
        return Array.from(navButtons).find(btn => {
            const navPath = btn.getAttribute('data-nav-path');
            return navPath && navPath.includes(`${type}=${componentId}`);
        });
    }

    // Set up all event listeners with error handling
    function setupEventListeners() {
        // HTMX events for content updates
        document.body.addEventListener('htmx:afterSettle', (event) => {
            try {
                setTimeout(() => {
                    updateAllButtons();
                }, 0);
            } catch (error) {
                console.error('Error in htmx:afterSettle:', error);
            }
        });

        document.body.addEventListener('htmx:load', (event) => {
            try {
                updateAllButtons();
            } catch (error) {
                console.error('Error in htmx:load:', error);
            }
        });

        // Handle navigation before HTMX requests
        document.body.addEventListener('htmx:beforeRequest', () => {
            try {
                closeActiveBootstrapComponents();
            } catch (error) {
                console.error('Error handling htmx:beforeRequest:', error);
            }
        });

        // Browser navigation events
        ['popstate', 'hashchange'].forEach(event => {
            window.addEventListener(event, () => {
                try {
                    updateAllButtons();
                    checkUrlParameters();
                } catch (error) {
                    console.error(`Error handling ${event}:`, error);
                }
            });
        });

        // Parameter button click handling
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-nav-type') === 'parameter') {
                btn.addEventListener('click', handleParameterButtonClick);
            } else if (btn.getAttribute('data-nav-type') === 'htmx') {
                btn.addEventListener('click', () => {
                    closeActiveBootstrapComponents();
                });
            }
        });
    }

    // Close any active Bootstrap components
    function closeActiveBootstrapComponents() {
        // Close active modals
        document.querySelectorAll('.modal.show').forEach(modal => {
            const instance = bootstrap.Modal.getInstance(modal);
            if (instance) {
                instance.hide();
            }
        });

        // Close active offcanvas
        document.querySelectorAll('.offcanvas.show').forEach(offcanvas => {
            const instance = bootstrap.Offcanvas.getInstance(offcanvas);
            if (instance) {
                instance.hide();
            }
        });
    }

    // Handle parameter button clicks
    function handleParameterButtonClick(event) {
        try {
            event.preventDefault();
            const btn = event.currentTarget;
            const navPath = btn.getAttribute('data-nav-path');
            const [key, value] = navPath.replace('?', '').split('=');
            const urlParams = new URLSearchParams(window.location.search);
            
            // Close other components first
            closeActiveBootstrapComponents();

            // Toggle parameter and component
            if (urlParams.get(key) === value) {
                closeBootstrapComponent(btn);
                removeUrlParameter(key);
            } else {
                updateUrlParameter(navPath);
            }
        } catch (error) {
            console.error('Error handling parameter button click:', error);
        }
    }

    // Close specific Bootstrap component
    function closeBootstrapComponent(btn) {
        const target = btn.getAttribute('data-bs-target');
        if (!target) return;

        const element = document.querySelector(target);
        if (!element) return;

        try {
            const instance = bootstrap.Modal.getInstance(element) || 
                           bootstrap.Offcanvas.getInstance(element);
            instance?.hide();
        } catch (error) {
            console.error('Error closing Bootstrap component:', error);
        }
    }

    // Update all button states with parameter priority
    function updateAllButtons() {
        // Get fresh collection of all nav buttons (including newly added ones)
        const currentNavButtons = document.querySelectorAll('[data-nav-type]');
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for active parameters
        const hasActiveParameter = Array.from(currentNavButtons).some(btn => 
            btn.getAttribute('data-nav-type') === 'parameter' && 
            isParameterButtonActive(btn)
        );

        currentNavButtons.forEach(btn => {
            const navType = btn.getAttribute('data-nav-type');
            const activeClass = btn.getAttribute('data-active-class') || 'active';

            if (navType === 'parameter') {
                updateParameterButtonState(btn);
            } else if (navType === 'htmx') {
                if (hasActiveParameter) {
                    btn.classList.remove(activeClass);
                } else {
                    updateButtonState(btn);
                }
            }
        });
    }

    // Check if parameter button is active
    function isParameterButtonActive(btn) {
        const navPath = btn.getAttribute('data-nav-path');
        if (!navPath) return false;

        const [key, value] = navPath.replace('?', '').split('=');
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key) === value;
    }

    // Update HTMX button state
    function updateButtonState(btn) {
        const activeClass = btn.getAttribute('data-active-class') || 'active';
        const navPath = btn.getAttribute('data-nav-path');
        const hxGet = btn.getAttribute('hx-get');
        const currentPath = window.location.pathname;

        const isActive = pathsMatch(currentPath, navPath) || 
                        (hxGet && pathsMatch(currentPath, hxGet));

        DEBUG && console.log('[Nav]', {
            button: btn.textContent.trim(),
            currentPath,
            navPath,
            isActive
        });

        btn.classList.toggle(activeClass, isActive);
    }

    // Update parameter button state
    function updateParameterButtonState(btn) {
        const activeClass = btn.getAttribute('data-active-class') || 'active';
        const isActive = isParameterButtonActive(btn);

        DEBUG && console.log('[Param]', {
            button: btn.textContent.trim(),
            navPath: btn.getAttribute('data-nav-path'),
            isActive
        });

        btn.classList.toggle(activeClass, isActive);
    }

    // Enhanced path matching with special cases
    function pathsMatch(path1, path2) {
        // Handle root path special case
        if (path2 === '/') {
            return path1 === '/' || path1 === '' || path1 === '/index.html';
        }
        
        // Handle index.html special case
        if (path2 === '/index.html') {
            return path1 === '/index.html';
        }

        path1 = cleanPath(path1);
        path2 = cleanPath(path2);

        // Exact match check first
        if (path1 === path2) return true;
        
        const segments1 = path1.split('/').filter(Boolean);
        const segments2 = path2.split('/').filter(Boolean);

        // Empty paths check
        if (!segments1.length && !segments2.length) return true;
        if (!segments1.length || !segments2.length) return false;

        // Must match exactly the same number of segments
        if (segments1.length !== segments2.length) return false;

        // Compare segments
        return segments1.every((segment, index) => segment === segments2[index]);
    }

    // Enhanced path cleaning
    function cleanPath(path) {
        if (!path) return '';
        if (path === '/') return '/';

        return path
            .replace(/^\.+|^\/+/, '')  // Remove leading dots and slashes
            .replace(/\.(html|htm)$/, '') // Remove extensions
            .replace(/\/$/, '')         // Remove trailing slash
            .toLowerCase();             // Case insensitive
    }

    // Check and activate Bootstrap components from URL
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        // Handle modals
        const modalID = urlParams.get('modal');
        if (modalID) {
            activateBootstrapComponent(modalID, 'modal');
        }

        // Handle offcanvas
        const offcanvasID = urlParams.get('offcanvas');
        if (offcanvasID) {
            activateBootstrapComponent(offcanvasID, 'offcanvas');
        }
    }

    // Activate Bootstrap component
    function activateBootstrapComponent(id, type) {
        const element = document.getElementById(id);
        if (!element) return;

        try {
            const component = type === 'modal' 
                ? new bootstrap.Modal(element)
                : new bootstrap.Offcanvas(element);

            component.show();
        } catch (error) {
            console.error(`Error activating ${type}:`, error);
        }
    }

    // Update URL parameter
    function updateUrlParameter(param) {
        const url = new URL(window.location);
        const [key, value] = param.replace('?', '').split('=');
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
        updateAllButtons();
    }

    // Remove URL parameter
    function removeUrlParameter(param) {
        const url = new URL(window.location);
        url.searchParams.delete(param);
        window.history.replaceState({}, '', url);
        updateAllButtons();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();



// Side Navigation Controller
// Get DOM elements
const sideNavContainer = document.getElementById('sideNavigationContainer');
const expandedNav = document.getElementById('sideNavigationExpanded');
const minimizedNav = document.getElementById('sideNavigationMinimized');
const contentContainer = document.getElementById('contentContainer');

// Set initial state from localStorage
let isExpanded = localStorage.getItem('navState') === 'expanded';

// Update navigation state
function updateNavigation() {
    document.body.classList.toggle('nav-expanded', isExpanded);
    document.body.classList.toggle('nav-minimized', !isExpanded);
    expandedNav.style.display = isExpanded ? 'block' : 'none';
    minimizedNav.style.display = isExpanded ? 'none' : 'block';
}

// Toggle navigation
function toggleNavigation() {
    isExpanded = !isExpanded;
    localStorage.setItem('navState', isExpanded ? 'expanded' : 'minimized');
    updateNavigation();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});