const path = require('path');
const fs = require('fs');

const FORMS_DIR = path.join(__dirname, '..', 'forms');
const DOCX_DIR = path.join(FORMS_DIR, 'docx');

function obtenerNombresFormularios() {
    const archivos = fs.readdirSync(FORMS_DIR).filter(f => f.endsWith('.json'));
    return archivos.map(f => {
        const contenido = JSON.parse(fs.readFileSync(path.join(FORMS_DIR, f), 'utf-8'));
        return contenido.nombreFormulario;
    });
}

function obtenerFormularioPorNombre(nombre) {
    const archivos = fs.readdirSync(FORMS_DIR).filter(f => f.endsWith('.json'));
    for (const f of archivos) {
        const contenido = JSON.parse(fs.readFileSync(path.join(FORMS_DIR, f), 'utf-8'));
        if (contenido.nombreFormulario === nombre) return contenido;
    }
    return null;
}

function obtenerRutaPlantilla(nombreFormulario) {
    const ruta = path.join(DOCX_DIR, `${nombreFormulario}.docx`);
    return fs.existsSync(ruta) ? ruta : null;
}

module.exports = { obtenerNombresFormularios, obtenerFormularioPorNombre, obtenerRutaPlantilla };
