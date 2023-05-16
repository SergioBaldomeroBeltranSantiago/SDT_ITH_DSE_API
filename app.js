//Dependencias
//API
const express = require("express");
const app = express();
//Base de datis
const sequelize = require("./Database/db");
const { Op } = require("sequelize");
//CROSS-ORIGIN-RESOURCE-SHARING
const cors = require("cors");
//Correos
const nodemailer = require("nodemailer");
//Fecha
const moment = require("moment");
//Archivos
const multer = require("multer");
const reader = require("xlsx");
const fs = require("fs");
const path = require("path");
//Seguridad
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

//Enrutamiento
const GestorTramites = require("./Routes/GestorTramites");
const GestorUsuarios = require("./Routes/GestorUsuarios");

app.use("/GestionTramites", GestorTramites);
app.use("/GestionUsuarios", GestorUsuarios);

//Patron GOF - Singleton
//Modelos
const Usuario = require("./Database/Models/Usuario");
const Estudiante = require("./Database/Models/Estudiante");
const Tramite = require("./Database/Models/Tramite");
const Descripcion_Menu = require("./Database/Models/Descripcion_Menu");
const Tramite_M = require("./Database/Models/Tramite_M");
const Solicitud = require("./Database/Models/Solicitud");
const Documento = require("./Database/Models/Documento");
const Solicitud_Bitacora = require("./Database/Models/Solicitud_Bitacora");

//Utilidades
const estatusLexico = {
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

const fileStatistics = reader.readFile(
  "./Estaticos/Prototipo - Estadistico.xlsx"
);

//Definimos el puerto a utilizar
const PORT = process.env.PORT;

//CROSS-ORIGIN-RESOURCE-SHARING
app.use(cors());

//Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Transportador de correo
var transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

//Ruta de la raiz del documento
app.use(express.static(__dirname));

//Determinar donde se guardaran los archivos y como se llamaran al subirse
var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    //Vamos a determinar si los archivos van a la carpeta de solicitudes o correos
    var carpeta = req.body.isSolicitud ? "Solicitudes" : "Correos";
    //Aquí determinamos si la subcarpeta es la matricula del estudiante o la ID de la plantilla del correo.
    var subCarpeta = req.body.subCarpeta;
    //Checamos que el directorio dinamico exista, si no existe, se crea
    var directorio = __dirname + "/Documentos/" + carpeta + "/" + subCarpeta;
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

//Middleware para subir archivos al servidor
const upload = multer({ storage }).any();

app.get("/", function (req, res) {
  res.send("Patata");
});

//Obtener archivos de los JSON existentes
app.get("/ObtenerDocumentoJSON", function (req, res) {
  console.log(req.query);
  console.log(req.body);
  const ruta = __dirname + "/Documentos/Solicitudes/" + req.query.subCarpeta;
  const archivo_buscar = req.query.nombreArchivo;

  fs.readdir(ruta, (error, archivos) => {
    if (error) {
      console.log(error);
      res.send({ Code: -1 });
      return;
    }

    archivos.forEach((archivo) => {
      if (archivo.split("_")[2] === archivo_buscar) {
        const archivo_descarga = ruta + "/" + archivo;

        fs.access(archivo_descarga, fs.constants.F_OK, (error) => {
          if (error) {
            console.log(error);
            res.send({ Code: -1 });
            return;
          }

          res.download(archivo_descarga, (error) => {
            if (error) {
              console.log(error);
              res.send({ Code: -1 });
              return;
            }
          });
        });
      }
    });
  });
});

//Enviar lista de JSON existentes
app.get("/ObtenerListaJSON", function (req, res) {
  fs.readdir("JSON", (error, archivos) => {
    if (error) {
      console.log(error);
      res.send({ Code: 0 });
    }

    const TitulosJSON = [];

    archivos.forEach((archivo) => {
      const Info = fs.readFileSync(path.join("JSON", archivo));
      const JInfo = JSON.parse(Info);
      TitulosJSON.push(JInfo);
    });

    if (TitulosJSON.length > 0) {
      res.send(TitulosJSON);
    } else {
      res.send({ Code: 0 });
    }
  });
});

//Modificar JSON existente
//Se va a eliminar
app.post("/ModificarJSONEliminar", function (req, res) {
  console.log(req.body);

  fs.readFile(
    "JSON/" + req.body.nombreArchivo,
    "utf8",
    (error, informacion) => {
      if (error) {
        console.log(error);
        res.send({ Code: 0 });
      }

      const Json = JSON.parse(informacion);
      Json.cuerpo = req.body.Cuerpo;
      Json.destinatario = req.body.Destinatario;
      Json.asunto = req.body.Asunto;
      Json.adjuntos = req.body.Adjuntos;

      fs.writeFile(
        "JSON/" + req.body.nombreArchivo,
        JSON.stringify(Json),
        (error) => {
          if (error) {
            console.log(error);
            res.send({ Code: 0 });
          }
          res.send({ Code: 1 });
        }
      );
    }
  );
});

app.post("/ModificarJSON", upload, function (req, res) {
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

  fecha_actual = fecha_actual.trim();
  var listaArchivosAdjuntos = "";
  //Checamos la carpeta en busca de archivos viejos, para eliminarlos
  var carpeta = __dirname + "/Documentos/Solicitudes/" + req.body.subCarpeta;
  if (fs.existsSync(carpeta)) {
    fs.readdirSync(carpeta).forEach((archivo) => {
      var fecha_archivo = archivo.split("_")[0].trim();
      if (fecha_actual !== fecha_archivo) {
        fs.unlinkSync(carpeta + "/" + archivo);
      } else {
        listaArchivosAdjuntos += archivo.split("_")[2].trim() + ";";
      }
    });
  }

  listaArchivosAdjuntos = listaArchivosAdjuntos.slice(0, -1);

  //Ahora que ya eliminamos los archivos viejos, solamente sobreescribimos los valores del JSON con los nuevos valores
  const jsonModificar = JSON.parse(req.body.data).titulo;
  console.log(JSON.parse(req.body.data));
  fs.readdir(__dirname + "/JSON", (error, archivos) => {
    if (error) {
      console.log(error);
      res.send({ Code: -1 });
    }

    archivos.forEach((archivo) => {
      fs.readFile(
        __dirname + "/JSON/" + archivo,
        "utf8",
        (error, informacion) => {
          if (error) {
            console.log(error);
            res.send({ Code: -1 });
          }

          const jsonInfo = JSON.parse(informacion);

          console.log(jsonInfo);
          console.log(jsonModificar);

          if (jsonInfo.titulo === jsonModificar) {
            jsonInfo.Asunto = jsonModificar.Asunto;
            jsonInfo.Destinatario = jsonModificar.Destinatario;
            jsonInfo.Cuerpo = jsonModificar.Cuerpo;
            jsonInfo.adjuntos = listaArchivosAdjuntos;

            fs.writeFile(
              __dirname + "/JSON/" + archivo,
              JSON.stringify(jsonInfo),
              (error) => {
                if (error) {
                  console.log(error);
                  res.send({ Code: -1 });
                }
                res.send({ Code: 1 });
              }
            );
          }
        }
      );
    });
  });
});

//Se va a transferir a GestorUsuarios.js
// Restablecer contraseñas
app.post("/RestorePassword", function (req, res) {
  // Obtener el correo electrónico del usuario desde la solicitud
  const matricula = req.body.matriculaUser;
  //const correo = req.body.correoUser;

  Usuario.findOne({ where: { matricula: matricula } })
    .then((usuario) => {
      if (usuario) {
        // Genera una nueva contraseña temporal
        const newPassword = req.body.matriculaUser;

        // Actualizar la contraseña de usuario en la base de datos
        usuario.contraseña = newPassword;
        usuario
          .save()
          .then(() => {
            // Enviar un correo electrónico al usuario con la nueva contraseña temporal
            //sendEmail(correo, newPassword);

            // Enviar una respuesta exitosa al cliente
            res.send({ Code: 1 });
          })
          .catch((error) => {
            console.log(error);

            // Enviar una respuesta de error al cliente
            res.send({ Code: -1 });
          });
      } else {
        // Enviar una respuesta al cliente indicando que el correo electrónico no existe
        res.send({ Code: 0 });
      }
    })
    .catch((error) => {
      console.log(error);

      // Enviar una respuesta de error al cliente
      res.send({ Code: -1 });
    });
});

//Se va a borrar
// Función para generar una contraseña temporal
function generateTempPassword() {
  const randomBytes = crypto.randomBytes(4).toString("hex");
  return bcrypt.hashSync(randomBytes, 10);
}

// Función para enviar un correo electrónico
function sendEmail(correo, newPassword) {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: correo,
    subject: "Restablecimiento de Contraseña",
    text: `Tu nueva contraseña temporal es: ${newPassword}. Por favor, cambia tu contraseña después de iniciar sesión.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Correo electrónico enviado: " + info.response);
    }
  });
}

//Se va a transferir a GestorUsuarios.js
//Conseguir datos del usuario activo en sesión, si es admin
app.post("/AdminInfo", function (req, res) {
  Usuario.findByPk(req.body.loginID)
    .then((result) => {
      //console.log(result);
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Conseguir datos del usuario activo en sesión, si es estudiante
app.post("/StudentInfo", function (req, res) {
  Usuario.findByPk(req.body.loginID, {
    include: [
      {
        model: Estudiante,
      },
    ],
  })
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
// Editar usuario
app.put("/EditarUsuario/:id", function (req, res) {
  const userID = req.params.id;
  const updatedData = req.body;

  // Buscar el usuario por su ID
  Usuario.findByPk(userID)
    .then((usuario) => {
      if (usuario) {
        // Actualizar los datos del usuario con los nuevos datos
        usuario
          .update(updatedData)
          .then((updatedUsuario) => {
            // Enviar la respuesta con el usuario actualizado
            res.send(updatedUsuario);
          })
          .catch((error) => {
            console.log(error);
            res.send({ Code: -1 });
          });
      } else {
        // Si el usuario no existe, enviar un código de error
        res.send({ Code: 0 });
      }
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Conseguir la lista de Solicitudes en el sistema, filtrada según el estatus
app.post("/RequestApplicationList", function (req, res) {
  Solicitud.findAll({
    attributes: [
      "id_Solicitud",
      "fecha_Solicitud",
      "fecha_Actualizacion",
      "estatus_Actual",
      "retroalimentacion_Actual",
    ],
    include: [
      { model: Usuario, attributes: ["matricula", "nombre_Completo"] },
      { model: Tramite, attributes: ["id_Tramite", "nombre_Tramite"] },
    ],
    where: { estatus_Actual: req.body.estatus },
    order: [
      ["fecha_Actualizacion", "ASC"],
      ["fecha_Solicitud", "ASC"],
    ],
  })
    .then((consult) => {
      res.send(consult);
    })
    .catch((error) => {
      console.log(error);
    });
});

//Conseguir la lista de Tramites cargados en el sistema
app.post("/RequestTransactionList", function (req, res) {
  Tramite.findAll({
    attributes: ["id_Tramite", "nombre_Tramite"],
    include: [
      {
        model: Tramite_M,
        attributes: ["id_Tramite_M", "texto", "tipo", "orden"],
        order: [
          ["tipo", "ASC"],
          ["orden", "ASC"],
        ],
      },
    ],
  })
    .then((consult) => {
      res.send(consult);
    })
    .catch((error) => {
      console.log(error);
    });
});

//Conseguir la lista de requisistos del tramite
app.post("/RequisitosTramite", function (req, res) {
  Tramite_M.findAndCountAll({
    attributes: ["id_Tramite_M", "texto", "tipo", "orden"],
  })
    .then((result) => {
      res.send({ result, Code: 1 });
    })
    .catch((error) => {
      console.log(error);
    });
});

//Enviar un correo a un destinatario
app.post("/SendEmail", function (req, res) {
  var mailOptions = {
    from: process.env.MAIL_USER,
    to: req.body.destinatario,
    subject: "Haz solicitado con exito el trámite de " + req.body.tramite,
    text:
      "Información del trámite para reclamo de pago único por concepto de orfandad. \nLa lista de los siguientes documentos son para subir en plataforma. Se ingluye un documento para llenar A COMPUTADORA" +
      "\n \n Lista de documentos a subir a la plataforma ##link##: " +
      "\n    -Carta de reclamacion llenada en maquina." +
      "\n    -Comprobante de domicilio del alumno. NO DEBE DE SER MAYOR A 3 MESES" +
      "\n    -Identificacion oficial del Padre/Madre/Tutor." +
      "\n    -Acta de nacimiento del asegurado o Padre/Madre o Tutor." +
      "\n    -Acta de defuncion del Padre/Madre o Tutor." +
      "\n    -Identificacion oficial del alumno. (En caso de ser menor de edad debera de ser la credencial de la institucion)" +
      "\n    -Acta de nacimiento del alumno." +
      "\n    -Resolucion de tutela ante un juez de familia. (En caso de aplicar)" +
      "\n    -Estado de cuenta bancario donde indique CLABE INTERBANCARIA del alumno. (La cuenta debe de ser capaz de recibir una transferencia de gran tamaño)" +
      "\n    -Constancia de inscripcion del alumno en el ciclo escolar vigente." +
      "\n \n \nEstaremos al pendiente, al ser aprobados los documentos, porfavor, ¡¡¡seguir las indicaciones de la imagen adjuntada!!!." +
      "\nEn caso de duda, mandar mensaje a ventanillaith@hermosillo.tecnm.mx o ir a Servicios Escolares.",

    attachments: [
      {
        path: "./Estaticos/Requisitos.jpeg",
      },
      {
        path: "./Estaticos/SOLICITUD_DE_RECLAMACIÓN_VIDA.pdf",
      },
    ],
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.send({ Code: -1 });
    } else {
      console.log("Correo enviado: " + info.response);
      res.send({ Code: 1 });
    }
  });
});

//Correo enviado paraseguimiento a la aseguradora
app.post("/SendSeguimientoEmail", function (req, res) {
  var mailOptions = {
    from: process.env.MAIL_USER,
    to: req.body.destinatario,
    subject: "Solicitud de seguimiento del seguro para " + req.body.nombre,
    text:
      'Buen dia, se le solicita una actualizacion sobre la solicitud con la guia de seguimiento "' +
      req.body.folio +
      '", a nombre de "' +
      req.body.nombre +
      '". \n Esto en relacion a la "SOLICITUD DE RECLAMACIÓN DE PAGO DE SINIESTRO" proveniende del Instituto Tecnologico de Hermosillo.' +
      "\n \n Estamos al pendiente de una respuesta, gracias.",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.send({ Code: -1 });
    } else {
      console.log("Correo enviado: " + info.response);
      res.send({ Code: 1 });
    }
  });
});

//Conseguir la solicitud del estudiante
app.post("/RequestUserApplication", function (req, res) {
  Solicitud.findAll({
    attributes: [
      "id_Solicitud",
      "fecha_Solicitud",
      "fecha_Actualizacion",
      "estatus_Actual",
      "retroalimentacion_Actual",
      "folio_Solicitud",
    ],
    include: [
      {
        model: Usuario,
        attributes: ["matricula", "nombre_Completo"],
        where: { matricula: req.body.matriculaUsuario },
      },
      { model: Tramite, attributes: ["id_Tramite", "nombre_Tramite"] },
      {
        model: Documento,
        attributes: ["id_Documento", "nombre_Documento", "ruta_Documento"],
      },
    ],
    where: {
      estatus_Actual: {
        [Op.and]: {
          [Op.lt]: 12,
          [Op.gt]: 0,
        },
      },
    },
  })
    .then((consult) => {
      res.send(consult);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Saber si el estudiante tiene una solicitud activa o no
app.post("/UserHasApplication", function (req, res) {
  Solicitud.count({
    where: {
      estudiante_Solicitante: req.body.matriculaUsuario,
    },
    estatus_Actual: {
      [Op.and]: {
        [Op.lt]: 12,
        [Op.gt]: 0,
      },
    },
  })
    .then((consult) => {
      let hasApplication = consult > 0;
      res.send({ hasApplication });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Registrar una nueva solicitud
app.post("/NewUserApplication", function (req, res) {
  Solicitud.create({
    fecha_Solicitud: moment(new Date(), "YYYY-MM-DD"),
    fecha_Actualizacion: moment(new Date(), "YYYY-MM-DD"),
    estatus_Actual: 1,
    retroalimentacion_Actual: estatusLexico[1],
    estudiante_Solicitante: req.body.estudiante_S,
    tramite_Solicitado: req.body.tramite_S,
  })
    .then(() => res.send({ Code: 1 }))
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Cambiar contraseña y/o correo electronico
app.post("/UpdateUserInfo", function (req, res) {
  Usuario.count({
    where: {
      matricula: req.body.matriculaUsuario,
      contraseña: req.body.contraseñaUsuario,
    },
  })
    .then((result) => {
      if (result > 0) {
        if (req.body.contraseñaUsuario !== req.body.newPassword) {
          Usuario.update(
            {
              contraseña: req.body.newPassword,
            },
            {
              where: {
                matricula: req.body.matriculaUsuario,
              },
            }
          );
        }
        if (req.body.correoUsuario !== req.body.newEmail) {
          Usuario.update(
            { correo_e: req.body.newEmail },
            { where: { matricula: req.body.matriculaUsuario } }
          );
        }
        res.send({ Code: 1 });
      } else {
        res.send({ Code: -1 });
      }
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: 0 });
    });
});

//Actualizar la solicitud
app.post("/updateApplication", function (req, res) {
  Solicitud_Bitacora.create({
    fecha_Cambio: moment(new Date(), "YYYY-MM-DD"),
    estatus_Anterior: req.body.estatusAnterior,
    retroalimentacion_Anterior: req.body.retroAnterior,
    solicitud_Asociada: req.body.id,
  })
    .then(() => {
      Solicitud.update(
        {
          estatus_Actual: req.body.nuevoEstatus,
          fecha_Actualizacion: moment(new Date(), "YYYY-MM-DD"),
          folio_Solicitud: req.body.folio,
          retroalimentacion_Actual: req.body.retroNueva,
        },
        {
          where: {
            id_Solicitud: req.body.id,
          },
        }
      )
        .then(() => {
          res.send({ Code: 1 });
        })
        .catch((error) => {
          console.log(error);
          res.send({ Code: -1 });
        });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Subir documentos al sistema
app.post(
  "/UploadDocuments",
  /*upload.any("pdf"),*/ function (req, res) {
    if (!req.files) {
      console.log("No files to upload");
    } else {
      let successUpload = true;
      for (var indice = 0; indice < req.files.length; indice++) {
        Documento.create({
          nombre_Documento: req.files[indice].originalname,
          ruta_Documento: req.files[indice].path,
          solicitud_Vinculada: req.body.text,
        })
          .then(() => {
            successUpload = true;
          })
          .catch((error) => {
            console.log(error);
            successUpload = false;
          });
      }
      res.send({ successUpload });
    }
  }
);

//Obtener documentos de la solicitud
app.post("/RetrieveDocuments", function (req, res) {
  Documento.findAll({
    where: {
      solicitud_Vinculada: req.body.solicitudID,
    },
  })
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

app.post("/GetConteoSolicitudes", function (req, res) {
  Solicitud.findAndCountAll({
    where: {
      estatus_Actual: req.body.estatus,
    },
  })
    .then((result) => {
      res.send(result.count.toString());
    })
    .catch((error) => {
      console.log(error);
      res.send(-1);
    });
});

//Obtener un solo documento para su descarga
app.get("/ObtainDocument", function (req, res) {
  Documento.findByPk(req.query.documentoID, {
    attributes: ["nombre_Documento", "ruta_Documento"],
  })
    .then((result) => {
      res.download(result.ruta_Documento, (err) => {
        if (err) {
          res.send({ Code: -1 });
        }
      });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

app.get("/ObtenerConteoEstadistico", function (req, res) {
  let estadisticas = [
    {
      Solicitudes_En_Total: 0,
      Solicitudes_En_Progreso: 0,
      Errores_Presentados: 0,
      Porcentaje_Finalización: 0,
      Porcentaje_Errores: 0,
    },
  ];

  //Solicitudes totales
  Solicitud.findAndCountAll({
    where: {
      fecha_Solicitud: {
        [Op.between]: [req.query.lowerRange, req.query.upperRange],
      },
    },
  })
    .then((result) => {
      estadisticas.Solicitudes_En_Total = result.count;
      //Solicitudes en progreso y terminadas
      Solicitud.findAndCountAll({
        where: {
          fecha_Solicitud: {
            [Op.between]: [req.query.lowerRange, req.query.upperRange],
          },
          estatus_Actual: {
            [Op.between]: [0, 11],
          },
        },
      })
        .then((result) => {
          estadisticas.Solicitudes_En_Progreso = result.count;
          //Errores actuales
          Solicitud.findAndCountAll({
            where: {
              fecha_Solicitud: {
                [Op.between]: [req.query.lowerRange, req.query.upperRange],
              },
              estatus_Actual: {
                [Op.or]: [3, 7, 9],
              },
            },
          })
            .then((result) => {
              estadisticas.Errores_Presentados = result.count;
              //Errores previos
              Solicitud_Bitacora.findAndCountAll({
                where: {
                  fecha_Cambio: {
                    [Op.between]: [req.query.lowerRange, req.query.upperRange],
                  },
                  estatus_Anterior: {
                    [Op.or]: [3, 7, 9],
                  },
                },
              })
                .then((result) => {
                  estadisticas.Errores_Presentados += result.count;
                  estadisticas.Porcentaje_Finalización =
                    estadisticas.Solicitudes_En_Progreso /
                    estadisticas.Solicitudes_En_Total;
                  estadisticas.Porcentaje_Errores =
                    estadisticas.Errores_Presentados /
                    estadisticas.Porcentaje_Finalización;
                  const ws = reader.utils.json_to_sheet(estadisticas);
                  reader.utils.book_append_sheet(
                    fileStatistics,
                    ws,
                    fileStatistics.SheetNames.length +
                      1 +
                      " - " +
                      req.query.lowerRange +
                      " - " +
                      req.query.upperRange
                  );
                  reader.writeFile(
                    fileStatistics,
                    "./Estaticos/Prototipo - Estadistico.xlsx"
                  );
                  res.download(
                    "./Estaticos/Prototipo - Estadistico.xlsx",
                    (err) => {
                      if (err) {
                        res.send({ Code: -1 });
                      }
                    }
                  );
                })
                .catch((error) => {
                  console.log(error);
                });
            })
            .catch((error) => {
              console.log(error);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

//Se va a transferir a GestorUsuarios.js
app.post("/SubirUsuarios", function (req, res) {
  Usuario.findOrCreate({
    where: { matricula: req.body.matriculaUser },
    defaults: {
      matricula: req.body.matriculaUser,
      nombre_Completo: req.body.nombreUser,
      contraseña: req.body.contraseñaUser,
      correo_e: req.body.correoUser,
    },
  })
    .then((result) => {
      Estudiante.findOrCreate({
        where: { matricula_Estudiante: req.body.matriculaUser },
        defaults: {
          matricula_Estudiante: req.body.matriculaUser,
          carrera: req.body.carreraUser,
          semestre: req.body.semestreUser,
        },
      })
        .then((result) => {
          res.send({ Code: 1 });
        })
        .catch((error) => {
          console.log(error);
          res.send({ Code: -1 });
        });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Alta de estudiantes
app.post("/AltaEstudiante", function (req, res) {
  Usuario.create({
    matricula: req.body.matriculaUser,
    nombre_Completo: req.body.nombreUser,
    contraseña: req.body.contraseñaUser,
    correo_e: req.body.correoUser,
  })
    .then((result) => {
      Estudiante.create({
        matricula_Estudiante: req.body.matriculaUser,
        carrera: req.body.carreraUser,
        semestre: req.body.semestreUser,
      })
        .then((result) => {
          res.send({ Code: 1 });
        })
        .catch((error) => {
          console.log(error);
          res.send({ Code: -1 });
        });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Alta de encargados
app.post("/AltaEncargados", function (req, res) {
  Usuario.create({
    matricula: req.body.matriculaUser,
    nombre_Completo: req.body.nombreUser,
    contraseña: req.body.contraseñaUser,
    correo_e: req.body.correoUser,
  })
    .then((result) => {
      res.send({ Code: 1 });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Edicion de estudiantes
app.post("/EditEstudiante", function (req, res) {
  Usuario.update(
    {
      matricula: req.body.nuevaMatricula,
      nombre_Completo: req.body.nombreUser,
      correo_e: req.body.correoUser,
    },
    {
      where: {
        matricula: req.body.matriculaUser,
      },
    }
  )
    .then((result) => {
      Estudiante.update(
        {
          carrera: req.body.carreraUser,
          semestre: req.body.semestreUser,
        },
        {
          where: {
            matricula_Estudiante: req.body.matriculaUser,
          },
        }
      )
        .then((result) => {
          res.send({ Code: 1 });
        })
        .catch((error) => {
          console.log(error);
          res.send({ Code: -1 });
        });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Edicion de encargados
app.post("/EditEncargados", function (req, res) {
  //console.log(req.body)
  Usuario.update(
    {
      matricula: req.body.nuevaMatricula,
      nombre_Completo: req.body.nombreUser,
      correo_e: req.body.correoUser,
    },
    {
      where: {
        matricula: req.body.matriculaUser,
      },
    }
  )
    .then((result) => {
      res.send({ Code: 1 });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Funcion de busqueda de Encargada
app.post("/searchEncargada", function (req, res) {
  Usuario.findAll({
    where: { matricula: req.body.matriculaUser },
    attributes: ["nombre_Completo", "correo_e"],
  })
    .then((result) => {
      Estudiante.count({
        where: { matricula_Estudiante: req.body.matriculaUser },
      }).then((resultado) => {
        console.log(resultado);
        if (resultado == 0) {
          res.send({ result, Code: 1 });
        } else {
          res.send({ Code: -1 });
        }
      });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Se va a transferir a GestorUsuarios.js
//Funcion de busqueda de Alumnos
app.post("/searchAlumno", function (req, res) {
  Estudiante.findAndCountAll({
    where: { matricula_Estudiante: req.body.matriculaUser },
    attributes: ["carrera", "semestre"],
  })
    .then((result) => {
      let datos = result.rows;
      let cantidad = result.count;
      Usuario.findAll({
        where: { matricula: req.body.matriculaUser },
        attributes: ["nombre_Completo", "correo_e"],
      })
        .then((result) => {
          if (cantidad == 1) {
            res.send({ result, datos, Code: 1 });
          } else {
            res.send({ Code: -1 });
          }
        })
        .catch((error) => {
          console.log(error);
          res.send({ Code: -1 });
        });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Conseguir datos de las descripciones
app.post("/infoDescripcionesMenus", function (req, res) {
  Descripcion_Menu.findAll({
    where: {
      id_texto: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  })
    .then((result) => {
      //console.log(result);
      res.send(result);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Inicializar el servidor
app.listen(PORT, function () {
  //Conectarse a la base de datos al iniciar el servidor
  //Utilizar alter:true para guardar cambios de los modelos a las tablas de SQL, en caso de que no se haga en automatico
  //Jamas usar force:true a no ser que sea indicado
  sequelize
    .authenticate()
    .then(() => {
      sequelize
        .sync(/*{ alter: true }*/)
        .then(() => console.log("Conexion exitosa"));
    })
    .catch((error) => console.log("Error de conexion: ", error));
});
