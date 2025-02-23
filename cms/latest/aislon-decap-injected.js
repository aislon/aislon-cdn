// Get just the domain part of the current page (no http/https)
function getSiteDomainOnly() {
  // window.location.origin returns something like "https://example.com"
  const fullOrigin = window.location.origin;
  // Remove http:// or https:// from the front
  return fullOrigin.replace(/^https?:\/\//, '');
}

// Persistent custom buttons function
function createCustomButtons() {
  // Create custom section container
  const customSection = document.createElement('div');
  customSection.id = 'custom-section';
  customSection.style.marginTop = '8px';
  customSection.style.marginBottom = '8px';
  customSection.style.width = '100%';
  customSection.style.display = 'flex';
  customSection.style.flexDirection = 'column'; // vertical stacking

  // 1) Create a simple link container (on top)
  const linkContainer = document.createElement('div');
  // Increase spacing below the link
  linkContainer.style.marginBottom = '16px'; // more margin

  const domainOnly = getSiteDomainOnly();

  const siteLink = document.createElement('a');
  // Still open in a new tab, but the actual HREF includes the full origin
  // so it properly opens the site if needed:
  siteLink.href = window.location.origin;
  siteLink.target = '_blank';

  // Just the domain text, bigger font, no icon
  siteLink.innerText = domainOnly;

  // Center, full width, bigger font
  siteLink.style.display = 'block';
  siteLink.style.width = '100%';
  siteLink.style.textAlign = 'center';
  siteLink.style.fontSize = '20px'; // bigger
  siteLink.style.textDecoration = 'none';
  siteLink.style.color = '#000';
  // Add a bit of bottom padding too, if desired
  siteLink.style.paddingBottom = '8px';

  linkContainer.appendChild(siteLink);

  // 2) Create navigation container for the two buttons
  const customNav = document.createElement('ul');
  customNav.className = 'css-kxvohc-SidebarNavList persistent-nav';
  customNav.style.width = '100%';
  customNav.style.display = 'flex';
  customNav.style.gap = '8px';
  customNav.style.padding = '0 12px';
  customNav.style.margin = '0';
  customNav.style.listStyle = 'none';

  // Shared button styles
  const sharedButtonStyle = `
    width: 100%;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #000;
    text-decoration: none;
    background-color: #f5f5f5;
    border-radius: 6px;
    transition: all 0.2s ease;
    height: 100%;
    border: 1px solid #e0e4e8;
    gap: 8px;
    justify-content: center;
  `;

  const sharedIconStyle = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: #ffffff;
    border-radius: 4px;
    border: 1px solid #e0e4e8;
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  `;

  // Create Analytics button
  const analyticsButton = document.createElement('li');
  analyticsButton.style.flex = '1';
  analyticsButton.innerHTML = `
    <a href="https://aislon.com/web/analytics" class="custom-nav-link" style="${sharedButtonStyle}">
      <span class="button-icon" style="${sharedIconStyle}">
        <img src="/admin/media/analytic.svg" width="20" height="20">
      </span>
      <span style="flex: 1;">Analytics</span>
    </a>
  `;

  // Create Site Info button
  const siteInfoButton = document.createElement('li');
  siteInfoButton.style.flex = '1';
  siteInfoButton.innerHTML = `
    <a href="custom-section" class="custom-nav-link" style="${sharedButtonStyle}">
      <span class="button-icon" style="${sharedIconStyle}">
        <img src="/admin/media/info.svg" width="20" height="20">
      </span>
      <span style="flex: 1;">Info</span>
    </a>
  `;

  // Add hover effects to the two buttons
  [analyticsButton, siteInfoButton].forEach(item => {
    const link = item.querySelector('a');
    link.addEventListener('mouseenter', () => {
      link.style.backgroundColor = '#e9e9e9';
    });
    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = '#f5f5f5';
    });
  });

  // Assemble everything
  customSection.appendChild(linkContainer); // (1) Link on top
  customNav.appendChild(analyticsButton);
  customNav.appendChild(siteInfoButton);
  customSection.appendChild(customNav);     // (2) Buttons below

  return customSection;
}

// Mutation observer to persistently inject buttons
function setupPersistentButtonInjection() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const sidebarNav = document.querySelector('.css-kxvohc-SidebarNavList');
      // Check if existing persistent nav already exists
      if (sidebarNav && !document.querySelector('.persistent-nav')) {
        const customSection = createCustomButtons();
        sidebarNav.parentNode.insertBefore(customSection, sidebarNav.parentNode.firstChild);
      }
    }
  });
  // Start observing the sidebar
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Avatar replacement script
function replaceAvatarIcon() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      const iconWrapper = document.querySelector(".css-16ibyj6-IconWrapper-AvatarPlaceholderIcon-avatarImage");
      if (iconWrapper) {
        const img = document.createElement("img");
        img.src = "media/aislonHat.png";
        img.width = 22;
        img.height = 22;
        img.style.margin = "auto";
        img.style.display = "block";
        iconWrapper.style.display = "flex";
        iconWrapper.style.justifyContent = "center";
        iconWrapper.style.alignItems = "center";
        iconWrapper.innerHTML = "";
        iconWrapper.appendChild(img);
        observer.disconnect();
        break;
      }
    }
  });
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupPersistentButtonInjection();
  replaceAvatarIcon();
});
