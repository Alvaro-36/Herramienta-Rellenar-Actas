const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const { getFormularios, getFormularioPorNombre, getPlantilla } = require('./controllers/formulariosController');

// Habilitar CORS estrictamente para la URL de Vercel y localhost
const corsOptions = {
    origin: ['https://herramienta-rellenar-actas.vercel.app', 'http://localhost:3000']
};
app.use(cors(corsOptions));

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de la API
app.get('/api/formularios', getFormularios);
app.get('/api/formularios/:nombre/plantilla', getPlantilla);
app.get('/api/formularios/:nombre', getFormularioPorNombre);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
