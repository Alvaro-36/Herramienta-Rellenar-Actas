const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const soloLocalhost = require('./middleware/soloLocalhost');
const { getFormularios, getFormularioPorNombre, getPlantilla } = require('./controllers/formulariosController');

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de la API
app.get('/api/formularios', soloLocalhost, getFormularios);
app.get('/api/formularios/:nombre/plantilla', soloLocalhost, getPlantilla);
app.get('/api/formularios/:nombre', soloLocalhost, getFormularioPorNombre);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
