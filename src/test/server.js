const express = require('express');
const { query, validationResult, matchedData, body } = require('express-validator');

const port = 9450;

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get('/test', (req, res) => {
    res.send('patata');
})

app.post('/test', (req, res) => {
    res.send('OK');
});

app.post('/Login',
 body(['id_number', 'password'], 'Campos invalidos').notEmpty().withMessage('Campos requeridos'),
 body('id_number').isInt({min: 0}).withMessage('id_number debe ser entero y positivo'),
  body('password').isString(),
   function (req, res) {
    // Get validation results
    const valResult = validationResult(req);
    // If object is NOT empty, there are errors
    if (!valResult.isEmpty()) {
        res.status(400); // HTTP 400 Bad Request
        res.send(valResult.mapped()); // Forward errors to front
        return;
    }
    const data = matchedData(req);
    // Validation has passed.
    // Process information using 'data' object
    // e.g. data.id_number, data.password, etc...
    res.sendStatus(200);
});

app.post("/RestorePassword", 
body('matriculaUser').notEmpty().withMessage("Campo requerido").isString(),
function (req, res) {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
        res.status(400); // HTTP 400 Bad Request
        res.send(valResult.mapped());
        return;
    }
    const data = matchedData(req);
    // Process data here...

    res.sendStatus(200);
});

app.post("/AdminInfo", function (req, res) {

});

app.post("/StudentInfo", function (req, res) {

});

app.put("/EditarUsuario/:id", function (req, res) {});

app.post("/RequestApplicationList", function (req, res) {

});

app.post("/RequestTransactionList", function (req, res) {

});

app.post("/RequisitosTramite", function (req, res) {});

app.post("/SendEmail", function (req, res) {

});

app.post("/SendSeguimientoEmail", function (req, res) {

});

app.post("/RequestUserApplication", function (req, res) {});

app.post("/UserHasApplication", function (req, res) {});

app.post("/NewUserApplication", function (req, res) {});

app.post("/UpdateUserInfo", function (req, res) {});

app.post("/updateApplication", function (req, res) {});

// app.post("/UploadDocuments", upload.any("pdf"), function (req, res) {});

app.post("/RetrieveDocuments", function (req, res) {});

app.post("/GetConteoSolicitudes", function (req, res) {});

app.get("/ObtainDocument", function (req, res) {});

app.get("/ObtenerConteoEstadistico", function (req, res) {});

app.post("/SubirUsuarios", function (req, res) {});

app.post("/AltaEstudiante", function (req, res) {});

app.post("/AltaEncargados", function (req, res) {});

app.post("/EditEstudiante", function (req, res) {});

app.post("/EditEncargados", function (req, res) {});

app.post("/searchEncargada", function (req, res) {});

app.post("/searchAlumno", function (req, res) {});

app.listen(port, () => {
    console.log('Server listening on port ', port);
})