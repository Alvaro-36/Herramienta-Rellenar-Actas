const params = new URLSearchParams(window.location.search);
const tipoFormulario = params.get("tipo");
let formularioActual = null;

async function cargarFormulario(nombre) {
    const response = await fetch(`/api/formularios/${encodeURIComponent(nombre)}`);
    const formulario = await response.json();
    return formulario;
}

async function cargarPlantillaDocx(nombreFormulario) {
    const response = await fetch(`/api/formularios/${encodeURIComponent(nombreFormulario)}/plantilla`);
    if (!response.ok) throw new Error(`Plantilla no encontrada para "${nombreFormulario}"`);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
}

function generarFormulario(formulario) {
    const container = document.getElementById("formularioContainer");
    const campos = Object.entries(formulario.camposFormulario);

    const camposHTML = campos.map(([campo, placeholder]) => {
        let defaultValue = "";
        const now = new Date();

        if (campo === "horaActual") {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            defaultValue = `${hours}:${minutes}`;
        } else if (campo === "fechaActual" || campo === "diaActual") {
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            defaultValue = `${day}.${month}.${year}`;
        } else if (campo === "nacionalidadInteresado" || campo === "paisInteresado") {
            defaultValue = "ARGENTINA";
        } else if (campo === "ciudadDomicilioInteresado" || campo === "provinciaConsulado") {
            defaultValue = "Mendoza";
        } else if (campo === "vecindadCivil") {
            defaultValue = "COMUN";
        }

        let inputHTML = `<input type="text" id="${campo}" name="${campo}" placeholder="" value="${defaultValue}" required>`;
        if (campo === "pMadre") {
            inputHTML = `
                <select id="${campo}" name="${campo}" required>
                    <option value="P" ${defaultValue === "P" ? "selected" : ""}>P (Padre)</option>
                    <option value="M" ${defaultValue === "M" ? "selected" : ""}>M (Madre)</option>
                </select>
            `;
        }

        return `
            <div class="field-group">
                <label for="${campo}">${campo[0].toUpperCase() + campo.slice(1)}</label>
                ${inputHTML}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="fields-list">
            ${camposHTML}
        </div>
    `;
}

async function rellenarFormulario() {
    const errorContainer = document.getElementById("error-message");
    errorContainer.style.display = "none";
    
    const form = document.getElementById("formulario");
    const datos = new FormData(form);

    // Validate that all fields have values
    let hasEmptyFields = false;
    for (const [campo, valor] of datos.entries()) {
        if (!valor) {
            hasEmptyFields = true;
            break;
        }
    }

    if (hasEmptyFields) {
        errorContainer.textContent = "Por favor, completa todos los campos antes de generar el documento.";
        errorContainer.style.display = "block";
        return;
    }

    let docxActual = await cargarPlantillaDocx(tipoFormulario);

    for (const [campo, valor] of datos.entries()) {
        const placeholder = formularioActual.camposFormulario[campo];
        console.log(`Reemplazando "${placeholder}" → "${valor}"`);
        docxActual = await reemplazarPalabraEnDocx(docxActual, placeholder, valor);
    }

    descargarBlob(docxActual, `${tipoFormulario}.docx`);
}

(async () => {
    if (!tipoFormulario) {
        document.getElementById("formularioContainer").innerHTML =
            "<p>Error: no se especificó el tipo de formulario en la URL.</p>";
        return;
    }

    formularioActual = await cargarFormulario(tipoFormulario);
    generarFormulario(formularioActual);

    document.getElementById("btnGenerar").addEventListener("click", rellenarFormulario);
})();
