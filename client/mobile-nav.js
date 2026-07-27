// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (!hamburgerBtn || !mobileNav) {
        console.info('[COC] Mobile navigation elements not found on this page.');
        return;
    }

    // 1. Create mobile overlay dynamically if it doesn't exist
    let overlay = document.querySelector('.mobile-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }

    // 2. Create close button dynamically inside the drawer if it doesn't exist
    let closeBtn = mobileNav.querySelector('.mobile-nav-close');
    if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'mobile-nav-close';
        closeBtn.innerHTML = '&times;'; // Large Close (X) symbol
        closeBtn.setAttribute('aria-label', 'Close menu');
        mobileNav.insertBefore(closeBtn, mobileNav.firstChild);
    }
    
    // Toggle state handlers
    function openMenu() {
        mobileNav.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    }

    // Wrap in requestAnimationFrame to ensure smooth layout transitions
    function closeMenu() {
        mobileNav.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable background scrolling
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }

    // Toggle menu on hamburger click
    hamburgerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (mobileNav.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Close menu when clicking the close button
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
    });

    // Close menu when clicking the overlay backdrop
    overlay.addEventListener('click', (e) => {
        closeMenu();
    });
    
    // Close menu when clicking outside the drawer
    document.addEventListener('click', (e) => {
        if (mobileNav.classList.contains('open') && 
            !mobileNav.contains(e.target) && 
            !hamburgerBtn.contains(e.target)) {
            closeMenu();
        }
    });
    
    // Mobile dropdown toggle (if submenus exist)
    const mobileDropdownToggle = document.querySelector('.mobile-dropdown-toggle');
    const mobileDropdown = document.querySelector('.mobile-dropdown');
    
    if (mobileDropdownToggle && mobileDropdown) {
        mobileDropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mobileDropdown.classList.toggle('active');
        });
    }
    
    // Close mobile nav when clicking a link (except dropdown toggle)
    const mobileNavLinks = mobileNav.querySelectorAll('a:not(.mobile-dropdown-toggle)');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
});
