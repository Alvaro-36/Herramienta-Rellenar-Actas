const { obtenerNombresFormularios, obtenerFormularioPorNombre, obtenerRutaPlantilla } = require('../services/formulariosService');

function getFormularios(req, res) {
    try {
        const tipos = obtenerNombresFormularios();
        res.json(tipos);
    } catch (error) {
        console.error('Error al obtener formularios:', error);
        res.status(500).json({ error: 'Error interno al leer los formularios.' });
    }
}

function getFormularioPorNombre(req, res) {
    try {
        const { nombre } = req.params;
        const formulario = obtenerFormularioPorNombre(nombre);
        if (!formulario) {
            return res.status(404).json({ error: 'Formulario no encontrado.' });
        }
        res.json(formulario);
    } catch (error) {
        console.error('Error al obtener el formulario:', error);
        res.status(500).json({ error: 'Error interno al leer el formulario.' });
    }
}

function getPlantilla(req, res) {
    try {
        const { nombre } = req.params;
        const ruta = obtenerRutaPlantilla(nombre);
        if (!ruta) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }
        res.download(ruta);
    } catch (error) {
        console.error('Error al obtener la plantilla:', error);
        res.status(500).json({ error: 'Error interno al leer la plantilla.' });
    }
}

module.exports = { getFormularios, getFormularioPorNombre, getPlantilla };
