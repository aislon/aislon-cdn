 // Persistent custom buttons function
 function createCustomButtons() {
  // Create custom section container
  const customSection = document.createElement('div');
  customSection.id = 'custom-section';
  customSection.style.marginTop = '12px';
  customSection.style.marginBottom = '12px';
  customSection.style.width = '100%';
  customSection.style.display = 'flex';

  // Create navigation container with proper styling
  const customNav = document.createElement('ul');
  customNav.className = 'css-kxvohc-SidebarNavList persistent-nav';
  customNav.style.width = '100%';
  customNav.style.display = 'flex';
  customNav.style.gap = '12px';
  customNav.style.padding = '0 12px';
  customNav.style.margin = '0';
  customNav.style.listStyle = 'none';

  // Create Analytics button
  const analyticsButton = document.createElement('li');
  analyticsButton.style.flex = '1';
  analyticsButton.innerHTML = `
    <a href="${ANALYTICS_URL}" class="custom-nav-link" style="
      width: 100%;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      text-decoration: none;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 1px solid #e0e4e8;
      gap: 10px;
    ">
      <span class="button-icon" style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: #f0f4f8;
        border-radius: 6px;
      ">
        <img src="/admin/media/analytic.svg" width="20" height="20" />
      </span>
      <span style="flex: 1; text-align: left;">Analytics</span>
    </a>`;

  // Create Site Info button
  const siteInfoButton = document.createElement('li');
  siteInfoButton.style.flex = '1';
  siteInfoButton.innerHTML = `
    <a href="${SITE_ID}" class="custom-nav-link" style="
      width: 100%;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      text-decoration: none;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 1px solid #e0e4e8;
      gap: 10px;
    ">
      <span class="button-icon" style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: #f0f4f8;
        border-radius: 6px;
      ">
        <img src="/admin/media/info.svg" width="20" height="20" />
      </span>
      <span style="flex: 1; text-align: left;">Site Info</span>
    </a>`;

  // Add hover and interaction effects
  [analyticsButton, siteInfoButton].forEach(button => {
    const link = button.querySelector('a');
    
    link.addEventListener('mouseenter', () => {
      link.style.transform = 'translateY(-3px)';
      link.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
      link.style.backgroundColor = '#f9fafb';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.transform = 'translateY(0)';
      link.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      link.style.backgroundColor = '#ffffff';
    });
    
    link.addEventListener('mousedown', () => {
      link.style.transform = 'scale(0.98)';
    });
    
    link.addEventListener('mouseup', () => {
      link.style.transform = 'scale(1)';
    });
  });

  // Assemble section
  customNav.appendChild(analyticsButton);
  customNav.appendChild(siteInfoButton);
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