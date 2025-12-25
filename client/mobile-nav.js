// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavCloseBtn = document.getElementById('mobile-nav-close-btn');
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobile-overlay';
    document.body.appendChild(overlay);
    
    // Open mobile menu
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            mobileNav.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    }
    
    // Close mobile menu
    const closeMobileMenu = () => {
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    };
    
    if (mobileNavCloseBtn) {
        mobileNavCloseBtn.addEventListener('click', closeMobileMenu);
    }
    
    // Close when clicking overlay
    overlay.addEventListener('click', closeMobileMenu);
    
    // Close when clicking a link
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
});
