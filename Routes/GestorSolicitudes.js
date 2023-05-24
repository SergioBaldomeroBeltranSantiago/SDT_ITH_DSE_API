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

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Solicitud = require("../Database/Models/Solicitud");
const Tramite = require("../Database/Models/Tramite");
const Documento = require("../Database/Models/Documento");
const Solicitud_Bitacora = require("../Database/Models/Solicitud_Bitacora");

//Utilidades
const estatus = {
  1: "Solicitud creada exitosamente, esperando documentos",
  2: "Haz subido tus documentos con exito, espera a que la encargada los revise",
  3: "Ha habido uno o varios errores en tus documentos, por favor revisalos y vuelve a subirlos",
  4: "Los documentos han sido aceptados, favor de venir de manera presencial al departamento de servicios escolares para entregarlos en físico",
  5: "Hemos recibido los documentos en persona, en poco tiempo seran enviados a la aseguradora",
  6: "Se ha armado tu solicitud formal y ya ha sido enviada a la aseguradora",
  7: "La solicitud ha sido rechazada por la aseguradora, revisa los documentos",
  8: "Se han recibido nuevos documentos en formato digital, espera a que se revisen",
  9: "Los nuevos documentos han sido rechazados, por favor sube nuevos documentos",
  10: "La solicitud ha sido reenviada a la aseguradora",
  11: "El finiquito ha sido enviado, necesitas venir en persona a firmarlo",
  12: "Solicitud terminada",
};

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
    new winston.transports.File({ filename: "error.log", level: "error" }),
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

//Directorio
router.use(express.static(__dirname));

//Obtendremos un reporte estadístico basandonos en un periodo de tiempo especificado por la maestra.
router.get("/estadisticos", function (req, res) {
  //Obtenemos todas las solicitudes existentes en el sistema
  Solicitud.findAll({
    attributes: ["fecha_Solicitud", "fecha_Actualizacion", "estatus_Actual"],
    include: [
      {
        model: Usuario,
        attributes: ["matricula", "nombre_Completo"],
      },
      {
        model: Tramite,
        attributes: ["nombre_Tramite"],
      },
    ],
  })
    .then((respuesta) => {
      //Inicializamos el JSON de los registros de solicitudes.
      var excelDatosRegistros = [{}];

      //Inicializamos los conteos estadísticos.
      var conteoTramitesTotales = 0;
      var conteoTramitesIniciados = 0;
      var conteoTramitesFinalizados = 0;
      var excelDatosConteos = [{}];

      //Se recorren todas las solicitudes existentes.
      for (var indice = 0; indice < respuesta.length; indice++) {
        //Se crea un enunciado para una lectura mas facíl por cada solicitud existente.
        var enunciado =
          'El alumno "' +
          respuesta[indice].Usuario.nombre_Completo +
          '" con matricula "' +
          respuesta[indice].Usuario.matricula +
          '" ha solicitado el trámite de "' +
          respuesta[indice].Tramite.nombre_Tramite +
          '".\n Se solicito el dia: ' +
          respuesta[indice].fecha_Solicitud +
          " y al dia de: " +
          respuesta[indice].fecha_Actualizacion +
          ' la solicitud se encuentra en el estatus de "' +
          estatus[respuesta[indice].estatus_Actual] +
          '".';

        //Se añade el registro a la colección para poder enviarlo a la hoja de excel.
        excelDatosRegistros.push({
          Matricula: respuesta[indice].Usuario.matricula,
          "Nombre del Alumno": respuesta[indice].Usuario.nombre_Completo,
          "Tramite solicitado": respuesta[indice].Tramite.nombre_Tramite,
          "Fecha en la que se solicito": respuesta[indice].fecha_Solicitud,
          "Ultimo estatus": estatus[respuesta[indice].estatus_Actual],
          "Ultima fecha de actualizacion":
            respuesta[indice].fecha_Actualizacion,
          Registro: enunciado,
        });

        //Contamos todas las solicitudes que tiene el sistema.
        conteoTramitesTotales++;

        //Obtenemos fechas importantes
        var fechaInicio = new Date(req.query.fechaInicioInforme).getTime();
        var fechaFinal = new Date(req.query.fechaFinalInforme).getTime();
        var fechaSolicitud = new Date(
          respuesta[indice].fecha_Solicitud
        ).getTime();
        var fechaActualizacion = new Date(
          respuesta[indice].fecha_Actualizacion
        ).getTime();

        //Checamos si la solicitud fue iniciada durante el periodo del informe.
        if (fechaSolicitud >= fechaInicio && fechaSolicitud <= fechaFinal) {
          conteoTramitesIniciados++;
        }

        //Checamos si la solicitud fue finalizada en este periodo seleccionado
        if (
          respuesta[indice].estatus_Actual === 12 &&
          fechaActualizacion >= fechaInicio &&
          fechaActualizacion <= fechaFinal
        ) {
          conteoTramitesFinalizados++;
        }
      }

      //Se añaden los conteos a la coleccion.
      excelDatosConteos.push({
        Estadistica: "Solicitudes activas en el sistema",
        Valor: conteoTramitesTotales,
      });
      excelDatosConteos.push({
        Estadistica:
          "Solicitudes iniciadas en el periodo: " +
          req.query.fechaInicioInforme +
          "|" +
          req.query.fechaFinalInforme,
        Valor: conteoTramitesIniciados,
      });
      excelDatosConteos.push({
        Estadistica:
          "Solicitudes finalizadas en el periodo: " +
          req.query.fechaInicioInforme +
          "|" +
          req.query.fechaFinalInforme,
        Valor: conteoTramitesFinalizados,
      });

      //Una vez que recorremos todas las solicitudes, se crea el archivo Excel.
      const excelLibro = XLSX.utils.book_new();

      //Se crea la hoja de excel con los registros obtenidos anteriormente.
      const excelHojaRegistros = XLSX.utils.json_to_sheet(excelDatosRegistros);

      //Se crea la hoja de excel con los conteos de las solicitudes.
      const excelHojaConteos = XLSX.utils.json_to_sheet(excelDatosConteos);

      //Se añade la hoja de excel de registros al archivo excel
      XLSX.utils.book_append_sheet(excelLibro, excelHojaRegistros, "Registros");

      //Se añade la hoja de excel de conteos al archivo excel
      XLSX.utils.book_append_sheet(excelLibro, excelHojaConteos, "Conteos");

      //Se crea el archivo excel en la carpeta Documentos/Otros de la raiz del sistema.
      const excelDirectorio = path.join(__dirname, "..") + "/Documentos/Otros";
      const excelArchivo = excelDirectorio + "/Estadistico.xlsx";
      if (!fs.existsSync(excelDirectorio)) {
        fs.mkdirSync(excelDirectorio, {
          recursive: true,
        });
      }

      if (fs.existsSync(excelArchivo)) {
        fs.unlinkSync(excelArchivo);
      }

      XLSX.writeFile(excelLibro, excelArchivo);
      res.send({
        Codigo: 1,
        Mensaje: "Estadístico terminado.",
      });
    })
    .catch((error) => {
      console.log(error);
      res.send({
        Codigo: 0,
        Mensaje: error,
      });
    });
});

//Crearemos una nueva solicitud.
router.post("/nueva", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");

    if (validarMatriculaEstudiante.test(req.body.matricula)) {
      //Generamos la fecha actual, en formato ISO 8601 YYYY-MM-DD
      var ahora = new Date();
      var fecha_servidor = ahora.toISOString();

      const nuevaSolicitud = await Solicitud.create({
        fecha_Solicitud: fecha_servidor,
        fecha_Actualizacion: fecha_servidor,
        estatus_Actual: 1,
        retroalimentacion_Actual: estatus[1],
        estudiante_Solicitante: req.body.matricula,
        tramite_Solicitado: req.body.Tramite.id_Tramite,
      });

      nuevaSolicitud ? res.sendStatus(200) : res.sendStatus(400);
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualizamos una solicitud existente.
router.put("/actualizar", async function (req, res, next) {
  try {
    const solicitud = await Solicitud.findByPk(req.body.id_Solicitud);
    if (solicitud) {
      var ahora = new Date();
      var fecha_servidor = ahora.toISOString();

      const solicitudBitacora = await Solicitud_Bitacora.create({
        fecha_Cambio: fecha_servidor,
        estatus_Anterior: solicitud.estatus_Actual,
        retroalimentacion_Anterior: solicitud.retroalimentacion_Actual,
        solicitud_Asociada: solicitud.id_Solicitud,
      });

      const solicitudActualizada = await solicitud.update({
        fecha_Actualizacion: fecha_servidor,
        estatus_Actual: req.body.estatus_Actual,
        retroalimentacion_Actual:
          req.body.retroalimentacion_Actual ?? estatus[req.body.estatus_Actual],
      });

      res.sendStatus(
        solicitudBitacora ? (solicitudActualizada ? 200 : 400) : 400
      );
    } else {
      //Enviamos un status 404 si el registro no fue encontrado.
      res.sendStatus(404);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Enviamos un correo con los requisitos de la solicitud.
router.post("/correo", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");

    if (validarMatriculaEstudiante.test(req.body.matricula)) {
      const usuario = await Usuario.findByPk(req.body.matricula);

      if (usuario) {
        const usuarioCorreo = usuario.correo_e;
        const plantillaCorreoDirectorio =
          path.join(__dirname, "..") + "/JSON/inicio.json";

        fs.readFile(plantillaCorreoDirectorio, "utf8", (error, informacion) => {
          if (error) {
            //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
            next(error);
            return;
          }

          const informacionJson = JSON.parse(informacion);

          var correoAdjuntos = [];

          const adjuntosCarpeta =
            path.join(__dirname, "..") + "/Documentos/Correos/Correo de inicio";

          const adjuntosArreglo = informacionJson.adjuntos.split(";");

          for (var indice = 0; indice < adjuntosArreglo.length; indice++) {
            correoAdjuntos.push({
              path: adjuntosCarpeta + "/" + adjuntosArreglo[indice],
            });
          }

          var parametrosCorreo = {
            from: process.env.MAIL_USER,
            to: usuarioCorreo,
            subject: informacionJson.titulo,
            text: informacionJson.cuerpo,
            attachments: correoAdjuntos,
          };

          transporte.sendMail(parametrosCorreo, function (error, informacion) {
            if (error) {
              //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
              next(error);
            }
            res.sendStatus(informacion.accepted.length > 0 ? 200 : 400);
          });
        });
      } else {
        //Enviamos un status 404 si el usuario no fue encontrado.
        res.sendStatus(404);
      }
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Pedimos la o las solicitudes que tenga un usuario
router.get("/consulta", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    if (validarMatriculaEstudiante.test(req.query.matricula)) {
      const usuario = await Usuario.findByPk(req.query.matricula);
      if (usuario) {
        const listaSolicitudesUsuario = await Solicitud.findAll({
          include: [
            {
              model: Usuario,
              attributes: ["matricula", "nombre_Completo", "correo_e"],
            },
            { model: Tramite, attributes: ["id_Tramite", "nombre_Tramite"] },
            {
              model: Documento,
              attributes: [
                "id_Documento",
                "nombre_Documento",
                "ruta_Documento",
              ],
            },
          ],
          attributes: [
            "id_Solicitud",
            "folio_Solicitud",
            "fecha_Solicitud",
            "fecha_Actualizacion",
            "estatus_Actual",
            "retroalimentacion_Actual",
          ],
          where: { estudiante_Solicitante: req.query.matricula },
          order: [
            ["fecha_Solicitud", "ASC"],
            ["fecha_Actualizacion", "ASC"],
          ],
        });
        //Enviamos la lista de solicitudes del usuario, incluso si esta vacia
        res.status(200).send(listaSolicitudesUsuario);
      } else {
        //Enviamos un status 404 si el usuario no fue encontrado.
        res.sendStatus(404);
      }
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Subir documentos para la solicitud
router.post("/documentos", upload, async function (req, res, next) {
  try {
    if (!req.files) {
      res.sendStatus(400);
    } else {
      var successfull = false;
      for (var indice = 0; indice < req.files.length; indice++) {
        const documentoSolicitud = await Documento.create({
          nombre_Documento: req.files[indice].originalname,
          ruta_Documento: req.files[indice].path,
          solicitud_Vinculada: req.body.id_Solicitud,
        });
        successfull = documentoSolicitud ? true : false;
      }
      res.sendStatus(successfull ? 200 : 400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Obtener un conteo de las solicitudes existentes, no necesariamente para un estadistico
router.get("/conteo", async function (req, res, next) {
  try {
    const conteoSolicitudes = await Solicitud.findAndCountAll({
      where: { estatus_Actual: req.query.estatus_Actual },
    });

    conteoSolicitudes
      ? res.status(200).send(conteoSolicitudes)
      : res.sendStatus(404);
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Obtener las solicitudes existentes, en base a un estatus seleccionado
router.get("/lista", async function (req, res, next) {
  try {
    //Validaciones
    var validarEstatus = req.query.estatus_Actual
      ? req.query.estatus_Actual > 0 && req.query.estatus_Actual < 13
      : false;

    if (validarEstatus) {
      const listaSolicitudesFiltrada = await Solicitud.findAll({
        attributes: [
          "id_Solicitud",
          "folio_Solicitud",
          "fecha_Solicitud",
          "fecha_Actualizacion",
          "estatus_Actual",
          "retroalimentacion_Actual",
        ],
        where: { estatus_Actual: req.query.estatus_Actual },
        include: [
          {
            model: Usuario,
            attributes: ["matricula", "nombre_Completo", "correo_e"],
          },
          { model: Tramite },
          {
            model: Solicitud_Bitacora,
            attributes: [
              "id_Solicitud_Bitacora",
              "fecha_Cambio",
              "estatus_Anterior",
              "retroalimentacion_Anterior",
            ],
          },
          {
            model: Documento,
            attributes: ["id_Documento", "nombre_Documento", "ruta_Documento"],
          },
        ],
      });

      //Enviamos la lista de solicitudes, incluso si esta vacia
      res.status(200).send(listaSolicitudesFiltrada);
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Obtenemos una solicitud en especifico, y solo una.
router.get("/consultar", async function (req, res, next) {
  try {
    const solicitudEncontrada = await Solicitud.findByPk(
      String(req.query.id_Solicitud),
      {
        attributes: [
          "id_Solicitud",
          "folio_Solicitud",
          "fecha_Solicitud",
          "fecha_Actualizacion",
          "estatus_Actual",
          "retroalimentacion_Actual",
        ],
        include: [
          {
            model: Usuario,
            attributes: ["matricula", "nombre_Completo", "correo_e"],
          },
          { model: Tramite },
          {
            model: Solicitud_Bitacora,
            attributes: [
              "id_Solicitud_Bitacora",
              "fecha_Cambio",
              "estatus_Anterior",
              "retroalimentacion_Anterior",
            ],
          },
          {
            model: Documento,
            attributes: ["id_Documento", "nombre_Documento", "ruta_Documento"],
          },
        ],
      }
    );
    solicitudEncontrada
      ? res.status(200).send(solicitudEncontrada)
      : res.sendStatus(404);
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

module.exports = router;
