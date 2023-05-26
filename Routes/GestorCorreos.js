//Dependencias
const express = require("express");
const router = express.Router();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const winston = require("winston");
const nodemailer = require("nodemailer");
const multer = require("multer");

//Directorio
router.use(express.static(__dirname));

//Almacenamiento de archivos
var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    //Vamos a determinar si los archivos van a la carpeta de solicitudes o correos
    var carpeta = req.body.isSolicitud ? "Solicitudes" : "Correos";
    //Aquí determinamos si la subcarpeta es la matricula del estudiante o la ID de la plantilla del correo.
    var subCarpeta = req.body.subCarpeta;
    //Checamos que el directorio dinamico exista, si no existe, se crea
    var directorio =
      path.join(__dirname, "..") + "/Documentos/" + carpeta + "/" + subCarpeta;
    if (!fs.existsSync(directorio)) {
      fs.mkdirSync(directorio, { recursive: true });
    }
    callBack(null, directorio);
  },
  filename: (req, file, callBack) => {
    var ahora = new Date();
    //Generamos la fecha actual, en formato ISO 8601 YYYY-MM-DD-HH-MM-SS
    var fecha_actual =
      ahora.getUTCFullYear() +
      "-" +
      (ahora.getUTCMonth() + 1) +
      "-" +
      ahora.getUTCDate() +
      "-" +
      ahora.getUTCHours() +
      "-" +
      ahora.getUTCMinutes() +
      "-" +
      ahora.getUTCSeconds();
    //Archivo cuyo nombre empieza con la fecha, se le añade un número aleatorio del 0 al 999, y al final, el nombre original del archivo, todo separado por _
    var nombre_archivo =
      fecha_actual +
      "_" +
      Math.floor(Math.random() * 1000) +
      "_" +
      file.originalname;
    callBack(null, nombre_archivo);
  },
});

const upload = multer({ storage }).any();

//CORS
router.use(cors());

//Middleware
router.use(
  express.json({
    limit: "10mb",
  })
);
router.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

//Errores
const registrarError = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      options: { flags: "a" },
    }),
  ],
});

const handleError = (error, req, res, next) => {
  registrarError(error);
  res.sendStatus(500);
};

router.use(handleError);

//Correo
var transporte = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

//Obtener la lista de los correos existentes
router.get("/lista", async function (req, res, next) {
  try {
    //Determinamos el directorio para las plantillas de correos
    const directorioCorreos = path.join(__dirname, "..", "/JSON");

    //Intentamos acceder a la carpeta
    fs.readdir(directorioCorreos, (error, archivos) => {
      if (error) {
        //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
        next(error);
        return;
      }

      //Logramos acceder a la carpeta, ahora debemos acceder a cada archivo y obtener el titulo de cada uno
      const correos = [];

      archivos.forEach((archivo) => {
        //Obtenemos la posible ruta del archivo.
        const rutaPlantillaCorreo = path.join(directorioCorreos, archivo);

        //Tratamos de leer el archivo
        const plantillaCorreo = fs.readFileSync(rutaPlantillaCorreo);

        //Ahora convertimos ese archivo a un formato JSON para mejor lectura dentro del programa
        const correo = JSON.parse(plantillaCorreo);

        //Añadimos cada correo posible al arreglo de correos.
        correos.push(correo);
      });

      correos.length > 0 ? res.status(200).send(correos) : res.sendStatus(204);
    });
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Descargar documento asociado a la plantilla
router.get("/documento", async function (req, res, next) {
  try {
    //Preparamos las rutas del directorio y archivo a descargar.
    const rutaDocumentos = path.join(
      __dirname,
      "..",
      "/Documentos/Correos/" + String(req.query.plantillaTitulo)
    );

    const rutaDocumentoPlantillaCorreo = path.join(
      rutaDocumentos,
      String(req.query.plantillaNombreArchivo)
    );

    //Preguntamos si el archivo existe
    fs.access(rutaDocumentoPlantillaCorreo, fs.constants.F_OK, (erro) => {
      erro
        ? res.sendStatus(404)
        : res.download(rutaDocumentoPlantillaCorreo, (err) => {
            if (err) {
              //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
              next(error);
            }
          });
    });
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualizar una de las plantillas de correo
router.put("/actualizar", async function (req, res, next) {
  try {
    //Intentaremos abrir el archivo .json de la plantilla
    const rutaDocumentoPlantilla = path.join(
      __dirname,
      "../JSON/",
      String(req.body.nombreArchivoPlantilla) === "Correo de seguimiento"
        ? "seguimiento.json"
        : "inicio.json"
    );

    fs.readFile(rutaDocumentoPlantilla, "utf8", (error, informacion) => {
      if (error) {
        //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
        next(error);
        return;
      }

      //Convertimos el archivo a un JSON manipulable
      var plantillaCorreo = JSON.parse(informacion);

      //Modificamos destinatario en caso de que haya cambios
      plantillaCorreo.destinatario =
        req.body.nuevoDestinatario !== ""
          ? req.body.nuevoDestinatario
          : plantillaCorreo.destinatario;

      //Modificamos asunto en caso de que haya cambios
      plantillaCorreo.asunto =
        req.body.nuevoAsunto !== ""
          ? req.body.nuevoAsunto
          : plantillaCorreo.asunto;

      //Modificamos cuerpo en caso de que haya cambios
      plantillaCorreo.cuerpo =
        req.body.nuevoCuerpo !== ""
          ? req.body.nuevoCuerpo
          : plantillaCorreo.cuerpo;

      //Una vez terminados los cambios, reescribimos el archivo JSON
      fs.writeFile(
        rutaDocumentoPlantilla,
        JSON.stringify(plantillaCorreo),
        (error) => {
          if (error) {
            //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
            next(error);
          }
          res.sendStatus(200);
        }
      );
    });
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Añadir nuevos documentos a una de las plantillas de correo
router.post("/subir", async function (req, res, next) {});

//Eliminar un documento de una plantilla de correo
router.get("/eliminar", async function (req, res, next) {});

module.exports = router;
