/**
 * Authentication Module for Appwrite
 * Handles OAuth, Email/Password, and Email OTP authentication methods
 * @module Authentication
 */




// Constants
const AUTH_TOAST_DURATION = 3000;
const AUTH_REDIRECT_DELAY = 1500;

// DOM Elements Cache
const DOM = {
    emailOTP: {
        field: document.getElementById('authEmailOTP-EmailInput'),
        button: document.getElementById('emailOtpButton'),
        container: {
            email: document.getElementById('emailOtpContainer-Email'),
            otp: document.getElementById('emailOtpContainer-Otp')
        },
        preview: document.getElementById('otpEmailPreviewText'),
        input: document.getElementById('otpInput'),
        confirmButton: document.getElementById('emailOtpConfirmButton')
    },
    emailPassword: {
        signUp: document.getElementById('authPasswordSignUp'),
        logIn: document.getElementById('authPasswordLogIn'),
        createForm: {
            email: document.getElementById('createEmailPassword-EmailInput'),
            password: document.getElementById('createEmailPassword-PasswordInput'),
            passwordContainer: document.getElementById('createEmailPassword-PasswordContainer'),
            button: document.getElementById('createEmailPassAuthButton')
        },
        loginForm: {
            email: document.getElementById('authEmailPassword-EmailInput'),
            password: document.getElementById('authEmailPassword-PasswordInput'),
            passwordContainer: document.getElementById('authEmailPassword-PasswordContainer'),
            button: document.querySelector('#authPasswordLogIn button.btn-primary')
        }
    },
    recovery: {
        modal: {
            header: document.getElementById('inputRequestTitle'),
            description: document.getElementById('inputRequestDescription'),
            button: document.getElementById('inputRequestButton')
        },
        password: document.getElementById('password')
    },
    verification: {
        title: document.getElementById('emailVerificationTitle'),
        body: document.getElementById('emailVerificationBody')
    }
};

// Utility Functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));




/**
 * OAuth Authentication
 */
async function oAuth(authProvider, scopes = []) {
    try {
        await account.createOAuth2Session(
            authProvider,
            `${PROJECT_DOMAIN}?authWith=${authProvider}`,
            `${PROJECT_DOMAIN}/auth/api/error.html`,
            scopes
        );
    } catch (error) {
        console.error(`${authProvider} Authentication Error:`, error);
        showToast({ 
            heading: `${authProvider} Authentication Error`, 
            message: error.message,
            type: 'error'
        });
    }
}

/**
 * Logout Handler
 */
async function logout() {
    showLoadingToast('logOutToast', {
        loadingHeading: 'Closing Session..',
        loadingMessage: 'Removing the current session.'
    });

    try {
        sessionStorage.clear();
        await account.deleteSession('current');
        updateLoadingToast('logOutToast', 'success', {
            heading: 'Logged Out Successfully',
            message: 'The current session has been closed.'
        });
    } catch (error) {
        updateLoadingToast('logOutToast', 'error', {
            heading: 'Something Went Wrong',
            message: 'Session could not be closed.'
        });
        throw error;
    } finally {
        const signOutModal = bootstrap.Modal.getInstance(document.getElementById('logOutModal'));
        if (signOutModal) signOutModal.hide();
        setTimeout(() => window.location.reload(), AUTH_REDIRECT_DELAY);
    }
}

/**
 * Email OTP Authentication
 */
if (DOM.emailOTP.field) {
    DOM.emailOTP.field.addEventListener('keydown', e => {
        if (e.key === 'Enter') authAccountEmailOTP();
    });
}

async function authAccountEmailOTP() {
    const email = DOM.emailOTP.field.value;
    DOM.emailOTP.preview.innerText = email;

    if (!email || !validateEmail(email)) {
        showToast({
            heading: !email ? 'Email is required' : 'Invalid Email',
            message: 'Please enter a valid email address.',
            type: 'error',
            duration: AUTH_TOAST_DURATION
        });
        DOM.emailOTP.field.focus();
        return;
    }

    try {
        DOM.emailOTP.button.disabled = true;
        const result = await account.createEmailToken(
            Appwrite.ID.unique(),
            email,
            false
        );

        showToast({
            heading: 'Email Sent',
            message: 'An OTP has been sent to your email.',
            duration: AUTH_TOAST_DURATION
        });

        // Switch to OTP input view
        DOM.emailOTP.container.email.style.display = 'none';
        DOM.emailOTP.container.otp.style.display = 'block';
        DOM.emailOTP.input.value = '';
        DOM.emailOTP.input.focus();

        // Setup OTP submission listeners
        const handleOTPSubmit = () => {
            if (DOM.emailOTP.input.value.length === 6) {
                createSessionFromOTP(result.userId, DOM.emailOTP.input.value);
            }
        };

        DOM.emailOTP.input.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleOTPSubmit();
        });

        DOM.emailOTP.confirmButton.addEventListener('click', handleOTPSubmit);

    } catch (error) {
        DOM.emailOTP.button.disabled = false;
        console.error('Error sending OTP:', error);
        showToast({
            heading: 'Error',
            message: 'Failed to send OTP. Please try again.',
            type: 'error',
            duration: AUTH_TOAST_DURATION
        });
    }
}

/**
 * Closes the current session.
 */
async function logout() {
    showLoadingToast('logOutToast', {
        loadingHeading: 'Closing Session..',
        loadingMessage: 'Removing the current session.'
    });

    try {
        sessionStorage.clear(); 
        await account.deleteSession('current');
        updateLoadingToast('logOutToast', 'success', { 
            heading: 'Logged Out Successfully',
            message: 'The current session has been closed.'
        });
    } catch (error) {
        //console.error('Logout failed:', error.message); // Some Error Tracking Service for this, maybe PostHog
        updateLoadingToast('logOutToast', 'error', { 
            heading: 'Something Went Wrong',
            message: 'Session could not be closed.'
        });
        throw error;
    } finally {
                // Close the Bootstrap modal with id 'signOutModal'
                const signOutModal = bootstrap.Modal.getInstance(document.getElementById('logOutModal'));
                if (signOutModal) {
                    signOutModal.hide();
                }
                // Wait for x seconds before refreshing the page
                setTimeout(() => {
                    window.location.reload();
                }, 1500);  // 1500 milliseconds = 1.5 seconds
            }
}



/** EMAIL OTP AUTH *//**
 *  OTP Authentication with Email - Simplified Version
 */

let emailAuthOtpField = document.getElementById('authEmailOTP-EmailInput');
if(emailAuthOtpField){
    emailAuthOtpField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            authAccountEmailOTP();
        }
    });
}

async function authAccountEmailOTP() {
    const email = document.getElementById('authEmailOTP-EmailInput').value;
    document.getElementById('otpEmailPreviewText').innerText = email;

    if (!email) {
        showToast({
            heading: 'Email is required',
            message: 'Please enter a valid email address.',
            duration: 2500,
            type: 'error'
        });
        document.getElementById('authEmailOTP-EmailInput').focus();
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast({
            heading: 'Invalid Email',
            message: 'Please enter a valid email address.',
            type: 'error',
            duration: 2000
        });
        document.getElementById('authEmailOTP-EmailInput').focus();
        return;
    }

    try {
        document.getElementById('emailOtpButton').disabled = true;
        // Send OTP to the email
        const result = await account.createEmailToken(
            Appwrite.ID.unique(),
            email,
            false
        );

        showToast({
            heading: 'Email Sent',
            message: 'An OTP has been sent to your email.',
            duration: 3000
        });
        // Hide email input and show OTP input field
        document.getElementById('emailOtpContainer-Email').style.display = 'none';
        //document.getElementById('firstStepAuth').style.display = 'none';
        document.getElementById('emailOtpContainer-Otp').style.display = 'block';
        document.getElementById('otpInput').focus();

        // Clear any pre-filled input
        const otpInput = document.getElementById('otpInput');
        otpInput.value = '';

        // Add event listener for OTP submission
        otpInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && otpInput.value.length === 6) {
                createSessionFromOTP(result.userId, otpInput.value);
            }
        });
        
        // Add event listener for button click
        document.getElementById('emailOtpConfirmButton').addEventListener('click', () => {
            if (otpInput.value.length === 6) {
                createSessionFromOTP(result.userId, otpInput.value);
            }
        });

    } catch (error) {
        document.getElementById('emailOtpButton').disabled = false;
        console.error('Error sending OTP:', error);
        showToast({
            heading: 'Error',
            message: 'Failed to send OTP. Please try again.',
            duration: 3000,
            type: 'error'
        });
    }

    // Simplified session creation function
    async function createSessionFromOTP(userID, otpCode) {

        if(!otpCode){
            showToast({
                heading: 'Code is required',
                duration: 2000
            });
            document.getElementById('otpInput').focus();
            return;
        }
        try {
            const sessionResult = await account.createSession(userID, otpCode);
            //console.log('Session created:', sessionResult);

            // Hide OTP input field
            document.getElementById('emailOtpContainer-Otp').style.display = 'none';
            checkUser();

        } catch (error) {
            console.error('Error creating session:', error);
            showToast({
                heading: error.message,
                //message: 'Incorrect OTP. Please try again.',
                duration: 3000,
            type: 'error'
            });

            // Clear OTP input field
            document.getElementById('otpInput').value = '';
        }
    }
}



/** EMAIL PASSWORD AUTH */


// Toggles the display of sign-up and log-in elements based on the 'auth' URL parameter or current display state.
document.addEventListener('DOMContentLoaded', () => {
    toggleAuthDisplay(new URLSearchParams(window.location.search).get('auth'));
});

function toggleAuthDisplay(auth) {
    const signUp = document.getElementById('authPasswordSignUp');
    const logIn = document.getElementById('authPasswordLogIn');
    if (signUp && logIn) {
        [signUp.style.display, logIn.style.display] = auth === 'signup' ? ['block', 'none'] : ['none', 'block'];
    }
}

function switchAuthPasswordType() {
    const signUp = document.getElementById('authPasswordSignUp');
    if (signUp) {
        toggleAuthDisplay(signUp.style.display === 'none' ? 'signup' : 'login');
    }
}

function showAuthPasswordForm() {
    const authPassword = document.getElementById('authPassword');
    const emailAuthSimpleButton = document.getElementById('emailAuthSimpleButton');
    if (authPassword && emailAuthSimpleButton) {
        authPassword.style.display = 'block';
        emailAuthSimpleButton.style.display = 'none';
    }
}

/**
 * Creates an account with email and password.
 * @returns {Promise<void>}
 */
function validateEmailAndShowPassword() {
    const emailInput = document.getElementById('createEmailPassword-EmailInput');
    if (!emailInput) return;

    const email = emailInput.value.trim();

    if (!email) {
        showToast({
            heading: 'Validation Failed',
            message: 'Email is required.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast({
            heading: 'Validation Failed',
            message: 'Please enter a valid email address.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    const passwordContainer = document.getElementById('createEmailPassword-PasswordContainer');
    if (passwordContainer) {
        passwordContainer.style.display = 'block';
        document.getElementById('createEmailPassword-PasswordInput').focus();
    }
}

async function createEmailPassAuth() {
    const emailInput = document.getElementById('createEmailPassword-EmailInput');
    const passwordInput = document.getElementById('createEmailPassword-PasswordInput');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        showToast({
            heading: 'Validation Failed',
            message: 'Email is required.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast({
            heading: 'Validation Failed',
            message: 'Please enter a valid email address.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    if (!password) {
        const passwordContainer = document.getElementById('createEmailPassword-PasswordContainer');
        if (passwordContainer) {
            passwordContainer.style.display = 'block';
            passwordInput.focus();
        }
        return;
    }

    showLoadingToast('createAccountEmailPassword', {
        loadingHeading: 'Creating Account..',
        loadingMessage: 'Please wait while we create your account.'
    });

    try {
        const result = await account.create(Appwrite.ID.unique(), email, password);
        console.log(result);

        updateLoadingToast('createAccountEmailPassword', 'success', {
            heading: 'Account Created Successfully',
            message: 'Successfully Signed Up to your account.'
        });

        const sessionResult = await account.createEmailPasswordSession(email, password);
        console.log(sessionResult);
        sendEmailVerificationLink();
        checkUser();
    } catch (error) {
        updateLoadingToast('createAccountEmailPassword', 'error', {
            heading: 'Account Creation Failed',
            message: error.message
        });
    }
}

const emailInput = document.getElementById('createEmailPassword-EmailInput');
if (emailInput) {
    emailInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') validateEmailAndShowPassword();
    });
}

const passwordInput = document.getElementById('createEmailPassword-PasswordInput');
if (passwordInput) {
    passwordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') createEmailPassAuth();
    });
}

const createEmailPassAuthButton = document.getElementById('createEmailPassAuthButton');
if (createEmailPassAuthButton) {
    createEmailPassAuthButton.addEventListener('click', createEmailPassAuth);
}




function validateEmailAndShowPasswordForLogin() {
    const emailInput = document.getElementById('authEmailPassword-EmailInput');
    if (!emailInput) return false;

    const email = emailInput.value.trim();

    if (!email) {
        showToast({
            heading: 'Validation Failed',
            message: 'Email is required.',
            duration: 3000
        });
        emailInput.focus();
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast({
            heading: 'Validation Failed',
            message: 'Please enter a valid email address.',
            duration: 3000
        });
        emailInput.focus();
        return false;
    }

    const passwordContainer = document.getElementById('authEmailPassword-PasswordContainer');
    if (passwordContainer) {
        passwordContainer.style.display = 'block';
        document.getElementById('authEmailPassword-PasswordInput').focus();
    }
    return true;
}

async function authEmailPassword() {
    const emailInput = document.getElementById('authEmailPassword-EmailInput');
    const passwordInput = document.getElementById('authEmailPassword-PasswordInput');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validateEmailAndShowPasswordForLogin()) {
        return;
    }

    if (!password) {
        const passwordContainer = document.getElementById('authEmailPassword-PasswordContainer');
        if (passwordContainer) {
            passwordContainer.style.display = 'block';
            passwordInput.focus();
        }
        return;
    }

    showLoadingToast('authEmailPasswordToast', {
        loadingHeading: 'Logging In..',
        loadingMessage: 'Please wait while we log you in.'
    });

    try {
        const result = await account.createEmailPasswordSession(email, password);
        console.log(result);

        updateLoadingToast('authEmailPasswordToast', 'success', {
            heading: 'Session Created',
            message: 'Successfully Signed In to your account.'
        });
        checkUser();
    } catch (error) {
        updateLoadingToast('authEmailPasswordToast', 'error', {
            heading: 'Sign In Failed',
            message: error.message
        });
    }
}

const authEmailPasswordEmailInput = document.getElementById('authEmailPassword-EmailInput');
if (authEmailPasswordEmailInput) {
    authEmailPasswordEmailInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') validateEmailAndShowPasswordForLogin();
    });
}

const authEmailPasswordPasswordInput = document.getElementById('authEmailPassword-PasswordInput');
if (authEmailPasswordPasswordInput) {
    authEmailPasswordPasswordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') authEmailPassword();
    });
}

const authPasswordLogInButton = document.querySelector('#authPasswordLogIn button.btn-primary');
if (authPasswordLogInButton) {
    authPasswordLogInButton.addEventListener('click', authEmailPassword);
}



async function sendEmailVerificationLink() {
    try {
        const result = await account.createVerification(
            PROJECT_DOMAIN + '/auth/api/verify.html' // url
        );
        console.log(result);
        showToast({ heading: 'Verification email sent', message: 'Check your email to verify your account.', duration: 2000 });

    } catch (error) {
        showToast({ heading: 'Verification email failed.', message: error.message, duration: 3000 });
    }
}

// Email Verification using link
if (window.location.pathname.includes('/auth/api/verify')) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const secret = urlParams.get('secret');

    if (userId && secret) {
        (async () => {
            try {
                const result = await account.updateVerification(userId, secret);
                console.log('Account verified successfully:', result);
                // Handle success (e.g., redirect to a success page or show a success message);
                const emailVerificationTitle = document.getElementById('emailVerificationTitle');
                const emailVerificationBody = document.getElementById('emailVerificationBody');
                if (emailVerificationTitle && emailVerificationBody) {
                    emailVerificationTitle.innerText = 'Account Verified!';
                    emailVerificationBody.innerText = '';
                }
            } catch (error) {
                console.error('Error verifying account:', error);
                const emailVerificationTitle = document.getElementById('emailVerificationTitle');
                const emailVerificationBody = document.getElementById('emailVerificationBody');
                if (emailVerificationTitle && emailVerificationBody) {
                    emailVerificationTitle.innerText = 'Verification Failed!';
                    emailVerificationBody.innerText = error.message;
                }
                // Handle error (e.g., show an error message)
            }
        })();
    } else {
        console.error('Missing userId or secret in the URL');
        const emailVerificationTitle = document.getElementById('emailVerificationTitle');
        const emailVerificationBody = document.getElementById('emailVerificationBody');
        if (emailVerificationTitle && emailVerificationBody) {
            emailVerificationTitle.innerText = 'Verification Failed!';
            emailVerificationBody.innerText = 'Missing userId or secret in the URL';
        }
        // Handle missing parameters (e.g., show an error message or redirect)
    }
}

async function resetPasswordRequest(emailInput) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
        if (!emailInput) return;

        const result = await account.createRecovery(
            emailInput,
            PROJECT_DOMAIN + '/auth/api/reset-password.html'
        );
        console.log(result);
        showToast({ heading: 'Recovery email sent.', message: 'Check your email to reset your password.', type: 'success', duration: 5500 });
        await delay(1000);

        const resetPasswordModalHeader = document.getElementById('inputRequestTitle');
        const resetPasswordModalParagraph = document.getElementById('inputRequestDescription');
        const resetPasswordModalButton = document.getElementById('inputRequestButton');
        if (resetPasswordModalHeader && resetPasswordModalParagraph && resetPasswordModalButton) {
            resetPasswordModalHeader.innerText = 'Recovery Email Sent';
            resetPasswordModalParagraph.innerText = 'Check your email to reset your password.';
            //emailInput.disabled = true;
            resetPasswordModalButton.disabled = true;
            resetPasswordModalButton.innerText = 'Email Sent';
        }
    } catch (error) {
        showToast({ heading: 'Recovery email failed.', message: error.message, duration: 3000, type: 'error' });
        await delay(4000);
        window.location.href = '/';
    }
}

function confirmPasswordRecovery() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');

        if (userId && secret) {
            (async () => {
                try {
                    const passwordInput = document.getElementById('password');
                    if (!passwordInput) return;

                    const result = await account.updateRecovery(
                        userId, // userId
                        secret, // secret
                        passwordInput.value // password
                    );
                    console.log(result);
                    showToast({ heading: 'Password Changed', message: 'Successfully changed the account password', duration: 3000, type: 'success' });
                    // Handle success (e.g., redirect to a success page or show a success message)
                } catch (error) {
                    console.error('Error verifying account:', error);
                    showToast({ heading: 'Password Change Failed', message: error.message, duration: 3000, type: 'error' });
                    // Handle error (e.g., show an error message)
                }
            })();
        } else {
            console.error('Missing userId or secret in the URL');
            // Handle missing parameters (e.g., show an error message or redirect)
        }
}

/**
 * Email/Password Authentication Module
 */

// Initialize auth display on page load
document.addEventListener('DOMContentLoaded', () => {
    const authParam = new URLSearchParams(window.location.search).get('auth');
    toggleAuthDisplay(authParam);
});

// Auth Form Event Listeners
if (DOM.emailPassword.createForm.email) {
    DOM.emailPassword.createForm.email.addEventListener('keypress', e => {
        if (e.key === 'Enter') validateEmailAndShowPassword();
    });
}

if (DOM.emailPassword.createForm.password) {
    DOM.emailPassword.createForm.password.addEventListener('keypress', e => {
        if (e.key === 'Enter') createEmailPassAuth();
    });
}

if (DOM.emailPassword.createForm.button) {
    DOM.emailPassword.createForm.button.addEventListener('click', createEmailPassAuth);
}

if (DOM.emailPassword.loginForm.email) {
    DOM.emailPassword.loginForm.email.addEventListener('keypress', e => {
        if (e.key === 'Enter') validateEmailAndShowPasswordForLogin();
    });
}

if (DOM.emailPassword.loginForm.password) {
    DOM.emailPassword.loginForm.password.addEventListener('keypress', e => {
        if (e.key === 'Enter') authEmailPassword();
    });
}

if (DOM.emailPassword.loginForm.button) {
    DOM.emailPassword.loginForm.button.addEventListener('click', authEmailPassword);
}

/**
 * Toggles between signup and login forms
 */
function toggleAuthDisplay(auth) {
    if (!DOM.emailPassword.signUp || !DOM.emailPassword.logIn) return;
    
    [DOM.emailPassword.signUp.style.display, DOM.emailPassword.logIn.style.display] = 
        auth === 'signup' ? ['block', 'none'] : ['none', 'block'];
}

function switchAuthPasswordType() {
    if (!DOM.emailPassword.signUp) return;
    toggleAuthDisplay(DOM.emailPassword.signUp.style.display === 'none' ? 'signup' : 'login');
}

/**
 * Shows password form after email validation
 */
function validateEmailAndShowPassword(isLogin = false) {
    const emailInput = isLogin ? DOM.emailPassword.loginForm.email : DOM.emailPassword.createForm.email;
    const passwordContainer = isLogin ? DOM.emailPassword.loginForm.passwordContainer : DOM.emailPassword.createForm.passwordContainer;
    const passwordInput = isLogin ? DOM.emailPassword.loginForm.password : DOM.emailPassword.createForm.password;
    
    if (!emailInput) return false;

    const email = emailInput.value.trim();
    
    if (!email || !validateEmail(email)) {
        showToast({
            heading: 'Validation Failed',
            message: !email ? 'Email is required.' : 'Please enter a valid email address.',
            duration: AUTH_TOAST_DURATION
        });
        emailInput.focus();
        return false;
    }

    if (passwordContainer) {
        passwordContainer.style.display = 'block';
        passwordInput?.focus();
    }
    return true;
}

/**
 * Creates new account with email/password
 */
async function createEmailPassAuth() {
    const email = DOM.emailPassword.createForm.email?.value.trim();
    const password = DOM.emailPassword.createForm.password?.value;

    if (!validateEmailAndShowPassword()) return;
    if (!password) {
        DOM.emailPassword.createForm.passwordContainer.style.display = 'block';
        DOM.emailPassword.createForm.password?.focus();
        return;
    }

    showLoadingToast('createAccountEmailPassword', {
        loadingHeading: 'Creating Account..',
        loadingMessage: 'Please wait while we create your account.'
    });

    try {
        const result = await account.create(Appwrite.ID.unique(), email, password);
        const sessionResult = await account.createEmailPasswordSession(email, password);

        updateLoadingToast('createAccountEmailPassword', 'success', {
            heading: 'Account Created Successfully',
            message: 'Successfully Signed Up to your account.'
        });

        await sendEmailVerificationLink();
        checkUser();
    } catch (error) {
        updateLoadingToast('createAccountEmailPassword', 'error', {
            heading: 'Account Creation Failed',
            message: error.message
        });
    }
}

/**
 * Authenticates existing user with email/password
 */
async function authEmailPassword() {
    const email = DOM.emailPassword.loginForm.email?.value.trim();
    const password = DOM.emailPassword.loginForm.password?.value;

    if (!validateEmailAndShowPassword(true)) return;
    if (!password) {
        DOM.emailPassword.loginForm.passwordContainer.style.display = 'block';
        DOM.emailPassword.loginForm.password?.focus();
        return;
    }

    showLoadingToast('authEmailPasswordToast', {
        loadingHeading: 'Logging In..',
        loadingMessage: 'Please wait while we log you in.'
    });

    try {
        const result = await account.createEmailPasswordSession(email, password);
        updateLoadingToast('authEmailPasswordToast', 'success', {
            heading: 'Session Created',
            message: 'Successfully Signed In to your account.'
        });
        checkUser();
    } catch (error) {
        updateLoadingToast('authEmailPasswordToast', 'error', {
            heading: 'Sign In Failed',
            message: error.message
        });
    }
}

/**
 * Password Recovery and Reset
 */
async function resetPasswordRequest(emailInput) {
    if (!emailInput) return;

    try {
        await account.createRecovery(
            emailInput,
            `${PROJECT_DOMAIN}/auth/api/reset-password.html`
        );

        showToast({ 
            heading: 'Recovery email sent.',
            message: 'Check your email to reset your password.',
            type: 'success',
            duration: 5500 
        });

        await delay(1000);

        // Update modal UI
        if (DOM.recovery.modal.header && DOM.recovery.modal.description && DOM.recovery.modal.button) {
            DOM.recovery.modal.header.innerText = 'Recovery Email Sent';
            DOM.recovery.modal.description.innerText = 'Check your email to reset your password.';
            DOM.recovery.modal.button.disabled = true;
            DOM.recovery.modal.button.innerText = 'Email Sent';
        }
    } catch (error) {
        showToast({ 
            heading: 'Recovery email failed.',
            message: error.message,
            duration: 3000,
            type: 'error'
        });
        await delay(4000);
        window.location.href = '/';
    }
}

/**
 * Handles password recovery confirmation
 */
function confirmPasswordRecovery() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const secret = urlParams.get('secret');

    if (!userId || !secret) {
        console.error('Missing userId or secret in the URL');
        return;
    }

    (async () => {
        try {
            if (!DOM.recovery.password) return;

            await account.updateRecovery(
                userId,
                secret,
                DOM.recovery.password.value
            );

            showToast({ 
                heading: 'Password Changed',
                message: 'Successfully changed the account password',
                duration: 3000,
                type: 'success'
            });

            // Optional: Redirect to login page after successful password reset
            setTimeout(() => window.location.href = '/login', AUTH_REDIRECT_DELAY);
        } catch (error) {
            console.error('Error updating password:', error);
            showToast({ 
                heading: 'Password Change Failed',
                message: error.message,
                duration: 3000,
                type: 'error'
            });
        }
    })();
}

/**
 * Email Verification
 */
async function sendEmailVerificationLink() {
    try {
        await account.createVerification(`${PROJECT_DOMAIN}/auth/api/verify.html`);
        showToast({ 
            heading: 'Verification email sent',
            message: 'Check your email to verify your account.',
            duration: 2000
        });
    } catch (error) {
        showToast({ 
            heading: 'Verification email failed.',
            message: error.message,
            duration: 3000
        });
    }
}

// Handle email verification callback
if (window.location.pathname.includes('/auth/api/verify')) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const secret = urlParams.get('secret');

    if (userId && secret) {
        (async () => {
            try {
                await account.updateVerification(userId, secret);
                
                if (DOM.verification.title && DOM.verification.body) {
                    DOM.verification.title.innerText = 'Account Verified!';
                    DOM.verification.body.innerText = 'Your email has been successfully verified.';
                }

                // Optional: Redirect to dashboard after delay
                setTimeout(() => window.location.href = '/dashboard', AUTH_REDIRECT_DELAY);
            } catch (error) {
                console.error('Error verifying account:', error);
                
                if (DOM.verification.title && DOM.verification.body) {
                    DOM.verification.title.innerText = 'Verification Failed!';
                    DOM.verification.body.innerText = error.message;
                }
            }
        })();
    } else {
        console.error('Missing userId or secret in the URL');
        
        if (DOM.verification.title && DOM.verification.body) {
            DOM.verification.title.innerText = 'Verification Failed!';
            DOM.verification.body.innerText = 'Missing verification parameters';
        }
    }
}



///////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    toggleAuthDisplay(new URLSearchParams(window.location.search).get('auth'));
});

function toggleAuthDisplay(auth) {
    const signUp = document.getElementById('authPasswordSignUp');
    const logIn = document.getElementById('authPasswordLogIn');
    if (signUp && logIn) {
        [signUp.style.display, logIn.style.display] = auth === 'signup' ? ['block', 'none'] : ['none', 'block'];
    }
}

function switchAuthPasswordType() {
    const signUp = document.getElementById('authPasswordSignUp');
    if (signUp) {
        toggleAuthDisplay(signUp.style.display === 'none' ? 'signup' : 'login');
    }
}
