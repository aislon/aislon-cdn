function createCustomButtons() {
  const customSection = document.createElement('div');
  customSection.id = 'custom-section';
  customSection.style.marginTop = '8px';
  customSection.style.marginBottom = '8px';
  customSection.style.width = '100%';
  customSection.style.display = 'flex';
  customSection.style.flexDirection = 'column';

  // Create URL link
  const urlLink = document.createElement('a');
  urlLink.href = `${CMS_URL}`;
  urlLink.target = '_blank';
  urlLink.style.cssText = `
      align-self: center;
      margin-bottom: 8px;
      color: #666;
      text-decoration: none;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s ease;
  `;
  urlLink.innerHTML = `
      Open CMS 
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
  `;

  urlLink.addEventListener('mouseenter', () => {
      urlLink.style.color = '#000';
  });

  urlLink.addEventListener('mouseleave', () => {
      urlLink.style.color = '#666';
  });

  // Create navigation container
  const customNav = document.createElement('ul');
  customNav.className = 'css-kxvohc-SidebarNavList persistent-nav';
  customNav.style.width = '100%';
  customNav.style.display = 'flex';
  customNav.style.gap = '8px';
  customNav.style.padding = '0 12px';
  customNav.style.margin = '0';
  customNav.style.listStyle = 'none';

  // Shared button styles (same as previous implementation)
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

  // Create buttons (same as previous implementation)
  const analyticsButton = document.createElement('li');
  analyticsButton.style.flex = '1';
  analyticsButton.innerHTML = `
    <a href="${ANALYTICS_URL}" class="custom-nav-link" style="${sharedButtonStyle}">
      <span class="button-icon" style="${sharedIconStyle}">
        <img src="/admin/media/analytic.svg" width="20" height="20" />
      </span>
      <span style="flex: 1;">Analytics</span>
    </a>`;

  const siteInfoButton = document.createElement('li');
  siteInfoButton.style.flex = '1';
  siteInfoButton.innerHTML = `
    <a href="${SITE_ID}" class="custom-nav-link" style="${sharedButtonStyle}">
      <span class="button-icon" style="${sharedIconStyle}">
        <img src="/admin/media/info.svg" width="20" height="20" />
      </span>
      <span style="flex: 1;">Information</span>
    </a>`;

  // Add hover effects
  [analyticsButton, siteInfoButton].forEach(button => {
    const link = button.querySelector('a');
    link.addEventListener('mouseenter', () => {
      link.style.backgroundColor = '#e9e9e9';
    });
    link.addEventListener('mouseleave', () => {
      link.style.backgroundColor = '#f5f5f5';
    });
  });

  // Assemble section
  customNav.appendChild(analyticsButton);
  customNav.appendChild(siteInfoButton);
  
  // Add URL link and navigation to custom section
  customSection.appendChild(urlLink);
  customSection.appendChild(customNav);

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