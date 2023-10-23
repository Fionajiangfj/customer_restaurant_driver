const navLinks = document.querySelectorAll('nav>a')

navLinks.forEach(link => {
    link.onmousedown = () => {
        link.classList.add('active-link');
    }
})