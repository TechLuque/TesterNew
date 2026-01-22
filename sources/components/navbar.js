function loadNavbar() {
    const navbarHTML = `
    <nav class="navbar">
        <div class="logo">LUQUE ACADEMY</div>
        <ul class="nav-links">
            <li><a href="https://wa.me/573176484451?text=Necesito%20ayuda%20para%20entrar%20a%20una%20sesi%C3%B3n">Soporte</a></li>
            <li><a href="/sources/views/lobby/lobby.html" class="btn-gold-outline">Inicio</a></li>
        </ul>
    </nav>
    `;
    // Insertar el menú al principio del body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
}

// Ejecutar cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
} else {
    loadNavbar();
}


