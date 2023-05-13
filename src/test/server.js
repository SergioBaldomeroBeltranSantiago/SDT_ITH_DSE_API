const express = require('express');
const { query, validationResult, matchedData, body, param, ExpressValidator } = require('express-validator');

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
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.post("/AdminInfo", 
body('loginID').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.post("/StudentInfo",
body('loginID').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.put("/EditarUsuario/:id", 
param('id').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
body('matricula').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una matricula válida"),
body('nombre_Completo').trim().notEmpty().isAlpha('es-ES').withMessage('Nombre no válido'),
body('contraseña').notEmpty().withMessage('Contraseña requerida').isString().withMessage('Campo no válido'),
body('correo_e').trim().notEmpty().normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
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

app.post("/RequestApplicationList", function (req, res) {
    // IDK what to validate here...
});

app.post("/RequestTransactionList", function (req, res) {
    // IDK what to validate here...
});

app.post("/RequisitosTramite", function (req, res) {
    // IDK what to validate here...
});

app.post("/SendEmail",
body('destinatario').trim().notEmpty().normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
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

app.post("/SendSeguimientoEmail",
body('destinatario').trim().notEmpty().normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
body('folio').trim().notEmpty().withMessage('Campo requerido').isString(),
body('nombre').trim().notEmpty().withMessage('Campo requerido').isString(),
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

app.post("/RequestUserApplication",
body('matriculaUsuario').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.post("/UserHasApplication", 
body('matriculaUsuario').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.post("/NewUserApplication",
body('estudiante_S').notEmpty().withMessage('Campo requerido'),
body('tramite_S').notEmpty().withMessage('Campo requerido'),
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

app.post("/UpdateUserInfo",
body('matriculaUsuario').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
body('contraseñaUsuario').notEmpty().withMessage('Contraseña requerida').isString(),
body('newPassword').notEmpty().withMessage('Nueva contraseña requerida').isString(),
body('newEmail').trim().notEmpty().withMessage('Nuevo email requerido').normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
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

app.post("/updateApplication", 
body('estatusAnterior').exists().withMessage('Status requerido').isNumeric({no_symbols: true}).withMessage('ID inválido'),
body('retroAnterior').trim().isString().escape().optional(),
body('id').trim().notEmpty(),
body('nuevoEstatus').exists().withMessage('Status requerido').isNumeric({no_symbols: true}).withMessage('ID inválido'),
body('retroNueva').trim().isString().escape().optional(),
body('folio').trim().notEmpty().withMessage('Campo requerido').isString(),
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

// app.post("/UploadDocuments", upload.any("pdf"), function (req, res) {});

app.post("/RetrieveDocuments", 
body('solicitudID', 'ID requerido').exists().trim().notEmpty(),
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

app.post("/GetConteoSolicitudes", 
body('estatus').exists().withMessage('Status requerido').isNumeric({no_symbols: true}),
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

app.get("/ObtainDocument",
query('documentoID').exists().isNumeric({no_symbols: true}),
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

app.get("/ObtenerConteoEstadistico", 
query('lowerRange').exists().isInt({min: 0}),
query('upperRange').exists().isInt({min: 0}),
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

app.post("/SubirUsuarios",
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una matricula válida"),
body('nombreUser').trim().notEmpty().isAlpha('es-ES').withMessage('Nombre no valido'),
body('contraseñaUser').notEmpty().isString(),
body('correoUser').trim().notEmpty().withMessage('email requerido').normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
body('carreraUser').trim().notEmpty().isString(),
body('semestreUser').trim().notEmpty().isString(),
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

app.post("/AltaEstudiante",
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una matricula válida"),
body('nombreUser').trim().notEmpty().isAlpha('es-ES').withMessage('Nombre no valido'),
body('contraseñaUser').notEmpty().isString(),
body('correoUser').trim().notEmpty().withMessage('email requerido').normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
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

app.post("/AltaEncargados",
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una matricula válida"),
body('nombreUser').trim().notEmpty().isAlpha('es-ES').withMessage('Nombre no valido'),
body('contraseñaUser').notEmpty().isString(),
body('correoUser').trim().notEmpty().withMessage('email requerido').normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
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

app.post("/EditEstudiante",
body('nombreUser').trim().notEmpty().isAlpha('es-ES').withMessage('Nombre no valido'),
body('correoUser').trim().notEmpty().withMessage('email requerido').normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una matricula válida"),
body('carreraUser').trim().notEmpty().isString(),
body('semestreUser').trim().notEmpty().isString(),
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

app.post("/EditEncargados", 
body('nombreUser').trim().notEmpty().withMessage('Nombre requerido').isAlpha('es-ES').withMessage('Nombre debe contener solo letras'),
body('correoUser').trim().notEmpty().normalizeEmail({gmail_lowercase: true, gmail_convert_googlemaildotcom: true, outlookdotcom_lowercase: true, icloud_lowercase: true}).isEmail().withMessage('Email no válido'),
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.post("/searchEncargada",
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.post("/searchAlumno", 
body('matriculaUser').notEmpty().withMessage("Campo requerido").matches(/^[bcdmBCDM][0-9]{8,8}$|^[0-9]{1,8}$/).withMessage("El campo no es una ID válida"),
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

app.listen(port, () => {
    console.log('Server listening on port ', port);
})