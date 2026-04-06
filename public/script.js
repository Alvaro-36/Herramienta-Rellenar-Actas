// --- UI index ---

async function cargarTiposFormulario() {
    const response = await fetch('/api/formularios');
    const tipos = await response.json();
    return tipos;
}

function generarBotonesFormularios(tipos) {
    const lista = document.getElementById("listaFormularios");

    lista.innerHTML = tipos.map(tipo => `
        <a href="formulario.html?tipo=${encodeURIComponent(tipo)}" class="btn-formulario">
            ${tipo}
        </a>
    `).join('');
}

(async () => {
    const tipos = await cargarTiposFormulario();
    generarBotonesFormularios(tipos);
})();
