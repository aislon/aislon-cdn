// Panel Based Settings Controller



async function emailPanel() {
    // Get UI elements
    const verificationBadge = document.getElementById('userEmailAddress-badge');
    const emailInput = document.getElementById('userEmailAddress-settingsInput');
    const resendButton = document.getElementById('userEmailAddress-resendEmail');
    const saveButton = document.getElementById('userEmailAddress-saveEmail');

    try {
        // Get account details
        const result = await account.get();
        const isVerified = result.emailVerification;
        const currentEmail = result.email;

        // Update email input
        emailInput.value = currentEmail;

        // Update UI based on verification status
        if (isVerified) {
            verificationBadge.textContent = 'Verified';
            verificationBadge.className = 'badge rounded-pill bg-success';
            emailInput.disabled = true;
            resendButton.disabled = true;
            saveButton.disabled = true;
            resendButton.classList.add('disabled');
            saveButton.classList.add('disabled');
        } else {
            verificationBadge.textContent = 'Unverified';
            verificationBadge.className = 'badge rounded-pill bg-warning';
            emailInput.disabled = false;
            resendButton.disabled = false;
            saveButton.disabled = false;
            resendButton.classList.remove('disabled');
            saveButton.classList.remove('disabled');
        }

        // Handle resend verification email
        resendButton.onclick = async () => {
            try {
                await account.createVerification(window.location.origin);
                showToast({
                    heading: 'Success!',
                    message: 'Verification email has been sent to your inbox.',
                    duration: 4500
                });
            } catch (error) {
                console.error('Failed to send verification email:', error);
                showToast({
                    heading: 'Uh oh! Something went wrong.',
                    message: 'Failed to send verification email. Please try again.',
                    duration: 4500
                });
            }
        };

        // Handle save email changes
        saveButton.onclick = async () => {
            const newEmail = emailInput.value;
            if (newEmail !== currentEmail) {
                try {
                    // First prompt for password
                    showInputDialog({
                        title: "Confirm Password",
                        description: "Please enter your password to update email",
                        placeholder: "Enter your password",
                        buttonText: "Update Email",
                        inputType: "password",
                        inputCallback: async (password) => {
                            try {
                                await account.updateEmail(newEmail, password);
                                await account.createVerification(window.location.origin);
                                showToast({
                                    heading: 'Success!',
                                    message: 'Email updated and verification email sent!',
                                    duration: 4500
                                });
                                location.reload();
                            } catch (error) {
                                console.error('Failed to update email:', error);
                                if (error.code === 401) {
                                    showToast({
                                        heading: 'Authentication Failed',
                                        message: 'Incorrect password provided.',
                                        duration: 4500
                                    });
                                } else {
                                    showToast({
                                        heading: 'Uh oh! Something went wrong.',
                                        message: 'Failed to update email. Please try again.',
                                        duration: 4500
                                    });
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Dialog error:', error);
                    showToast({
                        heading: 'Uh oh! Something went wrong.',
                        message: 'Failed to open password dialog.',
                        duration: 4500
                    });
                }
            }
        };

    } catch (error) {
        console.error('Failed to get account details:', error);
        showToast({
            heading: 'Uh oh! Something went wrong.',
            message: 'Failed to load account details. Please refresh the page.',
            duration: 4500
        });
    }
}




async function setupPreferencesListeners() {
    // Get references to DOM elements
    const emailSwitch = document.getElementById('emailNotificationsSwitch');
    const submitButton = document.getElementById('marketingPreferencesSubmitButton');

    // Initialize from database
    try {
        const response = await databases.getDocument(
            'userDB',
            'UserData',
            '673ce2870034cf0acd06'
        );
        
        // Set initial switch state
        emailSwitch.checked = response.emailNewsletter;
    } catch (error) {
        console.error('Error fetching preferences:', error);
    }

    // Handle submit button click
    submitButton.addEventListener('click', async () => {
        try {
            // Update database with current switch state
            await databases.updateDocument(
                'userDB',
                'UserData', 
                '673ce2870034cf0acd06',
                {
                    emailNewsletter: emailSwitch.checked
                }
            );

            // Show success message
            alert('Preferences updated successfully');
        } catch (error) {
            console.error('Error updating preferences:', error);
            alert('Failed to update preferences');
        }
    });
}





// Constants
const VALIDATION_STATES = {
    ERROR: 'red',
    FOCUS: '#86b7fe',
    DEFAULT: '#ced4da'
};

const ERROR_MESSAGES = {
    PASSWORD_REQUIREMENTS: 'Password must be at least 8 characters with uppercase and lowercase letters',
    PASSWORD_MATCH: 'Passwords do not match',
    EMPTY: ' ' // Preserve layout
};

class PasswordValidator {
    constructor() {
        this.fields = {
            old: {
                input: document.getElementById('passwordPanel-Old'),
                error: document.getElementById('errorLabel-Old')
            },
            new: {
                input: document.getElementById('passwordPanel-New'),
                error: document.getElementById('errorLabel-New')
            },
            confirm: {
                input: document.getElementById('passwordPanel-Confirm'),
                error: document.getElementById('errorLabel-Confirm')
            }
        };
        this.saveBtn = document.getElementById('passwordPanel-Button');
        this.setupListeners();
    }

    isValidPassword(password) {
        return password && /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);
    }

    validateField(field, value, validationFn, errorMessage) {
        const isValid = !value || validationFn(value);
        field.input.style.borderColor = value && !isValid ? VALIDATION_STATES.ERROR : VALIDATION_STATES.DEFAULT;
        field.error.textContent = value && !isValid ? errorMessage : ERROR_MESSAGES.EMPTY;
        return isValid;
    }

    validateForm() {
        const newValid = this.validateField(
            this.fields.new,
            this.fields.new.input.value,
            this.isValidPassword.bind(this),
            ERROR_MESSAGES.PASSWORD_REQUIREMENTS
        );

        const confirmValid = this.validateField(
            this.fields.confirm,
            this.fields.confirm.input.value,
            (value) => value === this.fields.new.input.value,
            ERROR_MESSAGES.PASSWORD_MATCH
        );

        const hasContent = Object.values(this.fields)
            .some(field => field.input.value.length > 0);

        this.saveBtn.disabled = !hasContent || !newValid || !confirmValid;
        this.saveBtn.classList.toggle('disabled', this.saveBtn.disabled);
    }

    setupListeners() {
        Object.values(this.fields).forEach(field => {
            field.input.addEventListener('input', () => this.validateForm());
            field.input.addEventListener('focus', (e) => {
                e.target.style.borderColor = VALIDATION_STATES.FOCUS;
            });
            field.input.addEventListener('blur', () => this.validateForm());
        });

        this.saveBtn.addEventListener('click', () => this.handleSubmit());
    }

    async handleSubmit() {
        try {
            this.saveBtn.disabled = true;
            this.saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

            await account.updatePassword(
                this.fields.new.input.value, 
                this.fields.old.input.value
            );

            showToast({
                heading: 'Success!',
                message: 'Your password has been updated successfully',
                duration: 3000
            });

            // Reset form
            Object.values(this.fields).forEach(field => {
                field.input.value = '';
                field.input.style.borderColor = VALIDATION_STATES.DEFAULT;
                field.error.textContent = ERROR_MESSAGES.EMPTY;
            });

        } catch (error) {
            this.fields.old.input.style.borderColor = VALIDATION_STATES.ERROR;
            this.fields.old.error.textContent = 'Current password is incorrect';
            this.fields.old.input.focus();
            
            showToast({
                heading: 'Authentication Error',
                message: 'Incorrect current password',
                duration: 500
            });
        } finally {
            this.saveBtn.disabled = false;
            this.saveBtn.innerHTML = 'Save';
        }
    }
}



function passwordPanel(){
// Initialize
const passwordValidator = new PasswordValidator();
}





async function renderUserSessions() {
    try {
        const result = await account.listSessions();
        const sessions = result.sessions;
        const tableBody = document.querySelector('#userSessionsTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        document.getElementById('sessionTableLoadingDiv').remove();
        sessions.forEach(session => {
            const row = document.createElement('tr');

            const browserCell = document.createElement('td');
            browserCell.textContent = `${session.clientName} ${session.clientVersion}`;
            row.appendChild(browserCell);

            const locationCell = document.createElement('td');
            locationCell.textContent = session.countryName;
            row.appendChild(locationCell);

            const ipCell = document.createElement('td');
            ipCell.textContent = session.ip;
            row.appendChild(ipCell);

            const lastUsedCell = document.createElement('td');
            lastUsedCell.textContent = new Date(session.$updatedAt).toLocaleString();
            row.appendChild(lastUsedCell);

            const actionCell = document.createElement('td');
            if (session.current) {
                actionCell.textContent = 'Active';
            } else {
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.classList.add('btn', 'btn-danger');
                removeButton.onclick = async () => {
                    const toastID = 'someToastID';
                    showLoadingToast(toastID, {
                        loadingHeading: 'Loading',
                        loadingMessage: 'Processing request...'
                    });

                    try {
                        await account.deleteSession(session.$id);
                        updateLoadingToast(toastID, 'success', {
                            heading: 'Success',
                            message: 'Session removed successfully.'
                        });
                        renderUserSessions(); // Refresh the table
                    } catch (error) {
                        updateLoadingToast(toastID, 'error', {
                            heading: 'Failed',
                            message: 'Failed to remove session.'
                        });
                        console.error('Error removing session:', error);
                    }
                };
                actionCell.appendChild(removeButton);
            }
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching user sessions:', error);
    }
}

