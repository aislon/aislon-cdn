function mobileMenu() {
    var x = document.getElementById("mobileMenu");
    var body = document.body;
    if (x.style.display === "none") {
        x.style.display = "block";
        body.style.position = "fixed"; // prevent scrolling
    } else {
        x.style.display = "none";
        body.style.position = "static"; // enable scrolling
    }
}


function sideNavigation() {
    var sideNavigationExpanded = document.getElementById('sideNavigationExpanded');
    var sideNavigationMinimized = document.getElementById('sideNavigationMinimized');
    mainContentContainer = document.getElementById('mainContentContainer');

    if (sideNavigationExpanded.style.display === 'none') {
        sideNavigationExpanded.style.display = 'block';
        sideNavigationMinimized.style.display = 'none';
        mainContentContainer.style.marginLeft = '12em';
    } else {
        sideNavigationExpanded.style.display = 'none';
        sideNavigationMinimized.style.display = 'block';
        mainContentContainer.style.marginLeft = '2em';
    }
}

function switchContainer(divToShow) {
    var containers = document.getElementsByClassName('mainContainer');
    for (var i = 0; i < containers.length; i++) {
        // Skip the footerContainer
        if (containers[i].id !== 'footerContainer') {
            containers[i].style.display = 'none';
        }
    }
    document.getElementById(divToShow).style.display = 'block';
    // Ensure footerContainer is always visible
    document.getElementById('footerContainer').style.display = 'block';
}

// Assuming each button in both menus has a data attribute 'data-menu-id' that links related buttons

// Step 1: Select all buttons with the class name 'expandedSideNavButton' and 'minimizedSideNavButton'
var expandedButtons = document.getElementsByClassName('expandedSideNavButton');
var minimizedButtons = document.getElementsByClassName('minimizedSideNavButton');

// Function to reset all buttons and highlight the correct one
function resetAndHighlightButtons(clickedButton) {
    // Reset all expanded buttons
    for (var i = 0; i < expandedButtons.length; i++) {
        expandedButtons[i].style.backgroundColor = 'white';
        expandedButtons[i].style.fontFamily = "'Nova Regular', sans-serif";
    }
    // Reset all minimized buttons
    for (var i = 0; i < minimizedButtons.length; i++) {
        minimizedButtons[i].style.backgroundColor = 'white'; // Assuming you want the same style reset for minimized buttons
    }
    // Highlight the clicked button
    clickedButton.style.backgroundColor = '#ededed';
    clickedButton.style.fontFamily = "'Nova Bold', sans-serif";
    
    // Find and highlight all corresponding buttons in the other menu
    var correspondingButtonId = clickedButton.getAttribute('data-menu-id');
    var correspondingButtons = document.querySelectorAll(`[data-menu-id="${correspondingButtonId}"]`);
    correspondingButtons.forEach(function(button) {
        if (button !== clickedButton) {
            button.style.backgroundColor = '#ededed'; // Adjust if the style should be different for minimized buttons
            // Only set the font if it's an expanded button
            if (button.classList.contains('expandedSideNavButton')) {
                button.style.fontFamily = "'Nova Bold', sans-serif";
            }
        }
    });
}

// Add click event listeners to all buttons
var allButtons = [...expandedButtons, ...minimizedButtons];
for (var i = 0; i < allButtons.length; i++) {
    allButtons[i].addEventListener('click', function(event) {
        resetAndHighlightButtons(event.currentTarget);
    });
}


