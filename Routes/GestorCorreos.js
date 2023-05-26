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

module.exports = router;