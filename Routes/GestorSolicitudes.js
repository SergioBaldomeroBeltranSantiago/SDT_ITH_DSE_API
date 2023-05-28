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
const { Op } = require("sequelize");

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Estudiante = require("../Database/Models/Estudiante");
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

//Directorio
router.use(express.static(__dirname));

//Obtendremos un reporte estadístico basandonos en un periodo de tiempo especificado por la maestra.
router.get("/reporte", async function (req, res, next) {
  try {
    //Validaciones
    var fecha_Inicio = new Date(req.query.fecha_Inicio_Reporte).toISOString();
    var fecha_Final = new Date(req.query.fecha_Final_Reporte).toISOString();

    //Verificamos que la fecha de inicio sea menor que la fecha final
    if (fecha_Final > fecha_Inicio) {
      //En caso de que si, empezamos con los conteos

      //Solicitudes existentes en el sistema
      const conteoSolicitudesTotales = await Solicitud.findAndCountAll({
        attributes: [
          "folio_Solicitud",
          "fecha_Solicitud",
          "fecha_Actualizacion",
          "estatus_Actual",
          "retroalimentacion_Actual",
        ],
        include: [
          {
            model: Usuario,
            attributes: ["matricula", "nombre_Completo"],
            include: [
              { model: Estudiante, attributes: ["carrera", "semestre"] },
            ],
          },
          {
            model: Tramite,
            attributes: ["nombre_Tramite"],
          },
        ],
      });

      //Preguntamos si existen solicitudes en el sistema, ya que de lo contrario, no tiene caso seguir con el estadistico.
      if (conteoSolicitudesTotales.count > 0) {
        //Solicitudes terminadas en total.
        const conteoSolicitudesFinalizadas = await Solicitud.findAndCountAll({
          attributes: [
            "folio_Solicitud",
            "fecha_Solicitud",
            "fecha_Actualizacion",
            "estatus_Actual",
            "retroalimentacion_Actual",
          ],
          include: [
            {
              model: Usuario,
              attributes: ["matricula", "nombre_Completo"],
              include: [
                { model: Estudiante, attributes: ["carrera", "semestre"] },
              ],
            },
            {
              model: Tramite,
              attributes: ["nombre_Tramite"],
            },
          ],
          where: {
            estatus_Actual: 12,
          },
        });
        //Solicitudes no iniciadas en el periodo deseado, pero si terminadas.
        const conteoSolicitudesFinalizadasNoIniciadas =
          await Solicitud.findAndCountAll({
            attributes: [
              "folio_Solicitud",
              "fecha_Solicitud",
              "fecha_Actualizacion",
              "estatus_Actual",
              "retroalimentacion_Actual",
            ],
            include: [
              {
                model: Usuario,
                attributes: ["matricula", "nombre_Completo"],
                include: [
                  { model: Estudiante, attributes: ["carrera", "semestre"] },
                ],
              },
              {
                model: Tramite,
                attributes: ["nombre_Tramite"],
              },
            ],
            where: {
              fecha_Solicitud: {
                [Op.notBetween]: [fecha_Inicio, fecha_Final],
              },
              fecha_Actualizacion: {
                [Op.between]: [fecha_Inicio, fecha_Final],
              },
              estatus_Actual: 12,
            },
          });

        //Solicitudes iniciadas y terminadas en el periodo deseado.
        const conteoSolicitudesFinalizadasIniciadas =
          await Solicitud.findAndCountAll({
            attributes: [
              "folio_Solicitud",
              "fecha_Solicitud",
              "fecha_Actualizacion",
              "estatus_Actual",
              "retroalimentacion_Actual",
            ],
            include: [
              {
                model: Usuario,
                attributes: ["matricula", "nombre_Completo"],
                include: [
                  { model: Estudiante, attributes: ["carrera", "semestre"] },
                ],
              },
              {
                model: Tramite,
                attributes: ["nombre_Tramite"],
              },
            ],
            where: {
              fecha_Solicitud: {
                [Op.between]: [fecha_Inicio, fecha_Final],
              },
              fecha_Actualizacion: {
                [Op.between]: [fecha_Inicio, fecha_Final],
              },
              estatus_Actual: 12,
            },
          });
        //Solicitudes activas pero no terminadas en el periodo deseado.
        const conteoSolicitudesActivas = await Solicitud.findAndCountAll({
          attributes: [
            "folio_Solicitud",
            "fecha_Solicitud",
            "fecha_Actualizacion",
            "estatus_Actual",
            "retroalimentacion_Actual",
          ],
          include: [
            {
              model: Usuario,
              attributes: ["matricula", "nombre_Completo"],
              include: [
                { model: Estudiante, attributes: ["carrera", "semestre"] },
              ],
            },
            {
              model: Tramite,
              attributes: ["nombre_Tramite"],
            },
          ],
          where: {
            fecha_Solicitud: {
              [Op.between]: [fecha_Inicio, fecha_Final],
            },
            fecha_Actualizacion: {
              [Op.between]: [fecha_Inicio, fecha_Final],
            },
            estatus_Actual: { [Op.lt]: 12 },
          },
        });

        //Ya que tenemos los conteos previstos, se procede a armar la primera colección de datos.
        const conteoSolicitudes = [
          {
            Estadistica: "Solicitudes totales en el sistema ",
            Conteo: Number(conteoSolicitudesTotales.count),
          },
          {
            Estadistica:
              "Solicitudes totales que se iniciaron en el periodo " +
              fecha_Inicio.split("T")[0] +
              " - " +
              fecha_Final.split("T")[0],
            Conteo:
              Number(conteoSolicitudesFinalizadasIniciadas.count) +
              Number(conteoSolicitudesActivas.count),
          },
          {
            Estadistica:
              "Solicitudes que se iniciaron pero aun no terminan en el periodo " +
              fecha_Inicio.split("T")[0] +
              " - " +
              fecha_Final.split("T")[0],
            Conteo: Number(conteoSolicitudesActivas.count),
          },
          {
            Estadistica: "Solicitudes totales que han finalizado ",
            Conteo: Number(conteoSolicitudesFinalizadas.count),
          },
          {
            Estadistica:
              "Solicitudes que se iniciaron y finalizaron en el periodo " +
              fecha_Inicio.split("T")[0] +
              " - " +
              fecha_Final.split("T")[0],
            Conteo: Number(conteoSolicitudesFinalizadasIniciadas.count),
          },
          {
            Estadistica:
              "Solicitudes que finalizaron pero no se iniciaron en el periodo " +
              fecha_Inicio.split("T")[0] +
              " - " +
              fecha_Final.split("T")[0],
            Conteo: Number(conteoSolicitudesFinalizadasNoIniciadas.count),
          },
        ];

        //Procedemos a crear la segunda colección de datos.
        var datosRegistros = [];

        //Iteramos todas las solicitudes para crear los registros.
        for (
          var indice = 0;
          indice < conteoSolicitudesTotales.count;
          indice++
        ) {
          //Creamos una especie de enunciado, para mayor facilidad de lectura
          var fechaSolicitudRegistro = new Date(
            conteoSolicitudesTotales.rows[indice].fecha_Solicitud
          )
            .toISOString()
            .split("T")[0];
          var fechaActualizacionRegistro = new Date(
            conteoSolicitudesTotales.rows[indice].fecha_Actualizacion
          )
            .toISOString()
            .split("T")[0];
          var enunciadoRegistro =
            "El estudiante: " +
            conteoSolicitudesTotales.rows[indice].Usuario.nombre_Completo +
            ", con matricula: " +
            conteoSolicitudesTotales.rows[indice].Usuario.matricula +
            ", inicio una solicitud para el trámite: " +
            conteoSolicitudesTotales.rows[indice].Tramite.nombre_Tramite +
            ", el dia: " +
            fechaSolicitudRegistro +
            ".\nAl dia de: " +
            fechaActualizacionRegistro +
            " la solicitud se encuentra en el estatus: " +
            estatus[conteoSolicitudesTotales.rows[indice].estatus_Actual] +
            " y " +
            (conteoSolicitudesTotales.rows[indice].folio_Solicitud
              ? " cuenta con el folio: " +
                conteoSolicitudesTotales.rows[indice].folio_Solicitud
              : " no cuenta con un folio asignado.");

          //Ahora creamos el resto del registro
          var datoRegistro = {
            Matricula: conteoSolicitudesTotales.rows[indice].Usuario.matricula,
            "Nombre del solicitante":
              conteoSolicitudesTotales.rows[indice].Usuario.nombre_Completo,
            "Tramite solicitado":
              conteoSolicitudesTotales.rows[indice].Tramite.nombre_Tramite,
            "Fecha de inicio": fechaSolicitudRegistro,
            "Ultimo estatus":
              estatus[conteoSolicitudesTotales.rows[indice].estatus_Actual],
            "Fecha de la ultima actualización": fechaActualizacionRegistro,
            Folio:
              conteoSolicitudesTotales.rows[indice].folio_Solicitud ??
              "Folio no asignado",
            Enunciado: enunciadoRegistro,
          };

          //Añadimos el registro al arreglo.
          datosRegistros.push(datoRegistro);
        }

        //Ya que tenemos todas las colecciones de datos necesarias, comenzamos a crear el archivo excel.
        const excelLibro = XLSX.utils.book_new();

        //Creamos dos hojas de excel, una para los registros, otra para los conteos.
        const excelHojaRegistros = XLSX.utils.json_to_sheet(datosRegistros);
        const excelHojaConteos = XLSX.utils.json_to_sheet(conteoSolicitudes);

        //Se añaden ambas hojas al excel creado.
        XLSX.utils.book_append_sheet(
          excelLibro,
          excelHojaRegistros,
          "Registros"
        );
        XLSX.utils.book_append_sheet(excelLibro, excelHojaConteos, "Conteos");

        //Procederemos a crear el archivo
        //Primero verificamos que la carpeta ruta deseada exista
        const fecha_Ahora = new Date().toISOString().split("T")[0];
        const excelDirectorio =
          path.join(__dirname, "..") + "/Documentos/Otros";
        const excelArchivo =
          excelDirectorio + "/Reporte." + fecha_Ahora + ".xlsx";

        if (!fs.existsSync(excelDirectorio)) {
          fs.mkdirSync(excelDirectorio, {
            recursive: true,
          });
        }

        //Creamos el archivo
        XLSX.writeFile(excelLibro, excelArchivo);

        //Enviamos el archivo para su descarga
        res.download(
          excelArchivo,
          "Reporte." + fecha_Ahora + ".xlsx",
          (error) => {
            if (error) {
              //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
              next(error);
            }
          }
        );
        return;
      }

      //Al no haber solicitudes existentes, tecnicamente no hay errores, pero tampoco se genera un archivo estadistico.
      res.sendStatus(204);
    } else {
      //Se envia un status 400 por datos de entrada invalidos.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
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
          req.body.retroalimentacion_Actual !== undefined &&
          req.body.retroalimentacion_Actual !== null &&
          req.body.retroalimentacion_Actual !== ""
            ? req.body.retroalimentacion_Actual
            : estatus[req.body.estatus_Actual],
        folio_Solicitud:
          req.body.folio_Solicitud !== undefined &&
          req.body.folio_Solicitud !== null &&
          req.body.folio_Solicitud !== ""
            ? req.body.folio_Solicitud
            : null,
      });

      solicitudBitacora
        ? solicitudActualizada
          ? res.sendStatus(200)
          : res.sendStatus(400)
        : res.sendStatus(400);
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
router.get("/correo", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");

    if (validarMatriculaEstudiante.test(String(req.query.matricula))) {
      const usuario = await Usuario.findByPk(String(req.query.matricula));

      if (usuario) {
        const plantillaCorreo = path.join(__dirname, "..", "/JSON/inicio.json");

        fs.readFile(plantillaCorreo, "utf8", (error, informacion) => {
          if (error) {
            //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
            next(error);
            return;
          }

          const informacionJson = JSON.parse(informacion);

          var correoAdjuntos = [];

          const adjuntosArreglo = informacionJson.adjuntos.split(";");

          if (adjuntosArreglo.length > 0) {
            const adjuntosCarpeta =
              path.join(__dirname, "..") +
              "/Documentos/Correos/Correo de inicio";

            for (var indice = 0; indice < adjuntosArreglo.length; indice++) {
              if (adjuntosArreglo[indice] !== "") {
                correoAdjuntos.push({
                  path: adjuntosCarpeta + "/" + adjuntosArreglo[indice],
                });
              }
            }
          }

          const usuarioJSON_ado = {
            matricula: usuario.matricula,
            nombre_Completo: usuario.nombre_Completo,
            correo_e: usuario.correo_e,
          };

          const correoModificado = informacionJson.destinatario.replace(
            /\$([^$]+)\$/g,
            (match, parametro) => {
              if (usuarioJSON_ado.hasOwnProperty(parametro))
                return usuarioJSON_ado[parametro];
              return match;
            }
          );

          var parametrosCorreo = {
            from: process.env.MAIL_USER,
            to: correoModificado,
            subject: informacionJson.asunto,
            text: informacionJson.cuerpo,
            attachments: correoAdjuntos,
          };

          transporte.sendMail(parametrosCorreo, function (error, info) {
            if (error) {
              //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
              next(error);
            } else {
              res.sendStatus(info.accepted.length > 0 ? 200 : 400);
            }
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
            ["fecha_Solicitud", "DESC"],
            ["fecha_Actualizacion", "DESC"],
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

//Descargar un documento asociado a una solicitud.
router.get("/descarga", async function (req, res, next) {
  try {
    const documentoEncontrado = await Documento.findByPk(
      String(req.query.id_Documento)
    );

    if (documentoEncontrado) {
      res.download(documentoEncontrado.ruta_Documento, (error) => {
        if (error) {
          //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
          next(error);
        }
      });
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Correo enviado paraseguimiento a la aseguradora
router.get("/seguimiento", async function (req, res, next) {
  try {
    const solicitudSeguir = await Solicitud.findByPk(
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
    if (solicitudSeguir) {
      const plantillaCorreo = path.join(
        __dirname,
        "..",
        "/JSON/seguimiento.json"
      );

      fs.readFile(plantillaCorreo, "utf8", (error, informacion) => {
        if (error) {
          //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
          next(error);
          return;
        }

        const informacionJson = JSON.parse(informacion);

        const solicitudJSON_ada = {
          folio_Solicitud:
            solicitudSeguir.folio_Solicitud ?? "Folio de ejemplo",
        };

        const usuarioJSON_ado = {
          nombre_Completo: solicitudSeguir.Usuario.nombre_Completo,
        };

        var correoAdjuntos = [];

        const adjuntosArreglo = informacionJson.adjuntos.split(";");

        if (adjuntosArreglo.length > 0) {
          const adjuntosCarpeta =
            path.join(__dirname, "..") +
            "/Documentos/Correos/Correo de seguimiento";

          for (var indice = 0; indice < adjuntosArreglo.length; indice++) {
            if (adjuntosArreglo[indice] !== "") {
              correoAdjuntos.push({
                path: adjuntosCarpeta + "/" + adjuntosArreglo[indice],
              });
            }
          }
        }

        const cuerpoParametrizado = informacionJson.cuerpo.replace(
          /\$([^$]+)\$/g,
          (match, parametro) => {
            if (usuarioJSON_ado.hasOwnProperty(parametro)) {
              return usuarioJSON_ado[parametro];
            } else if (solicitudJSON_ada.hasOwnProperty(parametro)) {
              return solicitudJSON_ada[parametro];
            }
            return match;
          }
        );

        var parametrosCorreo = {
          from: process.env.MAIL_USER,
          to: informacionJson.destinatario,
          subject: informacionJson.asunto,
          text: cuerpoParametrizado,
          attachments: correoAdjuntos.length > 0 ? correoAdjuntos : [],
        };

        transporte.sendMail(parametrosCorreo, function (error, info) {
          if (error) {
            //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
            next(error);
          } else {
            res.sendStatus(info.accepted.length > 0 ? 200 : 400);
          }
        });
      });
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

module.exports = router;
