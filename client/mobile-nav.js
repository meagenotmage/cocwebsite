// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (!hamburgerBtn || !mobileNav) {
        console.log('Mobile nav elements not found');
        return;
    }
    
    // Toggle mobile menu dropdown
    hamburgerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hamburger clicked, toggling menu');
        mobileNav.classList.toggle('open');
        console.log('Mobile nav classes:', mobileNav.className);
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav && !mobileNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            mobileNav.classList.remove('open');
        }
    });
    
    // Mobile dropdown toggle
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
            mobileNav.classList.remove('open');
        });
    });
});
