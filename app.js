//Import
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");
const nodemailer = require("nodemailer");
const moment = require("moment");
const { Op } = require("sequelize");
const multer = require("multer");
const reader = require("xlsx");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

//Patron GOF - Singleton
const Usuario = require("./Database/Models/Usuario");
const Estudiante = require("./Database/Models/Estudiante");
const Tramite = require("./Database/Models/Tramite");
const Imagen = require("./Database/Models/Imagen");
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
const PORT = process.env.PORT || 3001;

//CORS
app.use(cors());

//Documentos
app.use(express.static(__dirname));

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

//Multer usage
var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, __dirname + "/Documentos");
  },
  filename: (req, file, callBack) => {
    callBack(null, Date.now() + "_" + file.originalname);
  },
});

//Multer almacenar
var upload = multer({
  storage: storage,
});

//Rutas
app.get("/", function (req, res) {
  res.send("Patata");
});

//Login
app.post("/Login", function (req, res) {
  //Buscar si existe el registro de usuario

  Usuario.findByPk(req.body.id_number)
    .then((result) => {
      //Si si existe, checar si coincide usuario y contraseña
      if (result != null) {
        Usuario.count({
          where: {
            matricula: req.body.id_number,
            contraseña: req.body.password,
          },
        })
          .then((consult) => {
            if (consult > 0) {
              //Si si coinciden, se envia codigo de confirmación
              res.send({ Code: 1 });
            } else {
              //Si no coinciden, se envia codigo de contraseña incorrecta
              res.send({ Code: -1 });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        //Si no existe, se envia codigo de usuario no existente
        res.send({ Code: 0 });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

// Restablecer contraseñas
app.post("/RestorePassword", function (req, res) {
  // Obtener el correo electrónico del usuario desde la solicitud
  const email = req.body.email;

  Usuario.findOne({ where: { email: email } })
    .then((usuario) => {
      if (usuario) {
        // Genera una nueva contraseña temporal
        const newPassword = generateTempPassword();

        // Actualizar la contraseña de usuario en la base de datos
        usuario.contraseña = newPassword;
        usuario.save()
          .then(() => {
            // Enviar un correo electrónico al usuario con la nueva contraseña temporal
            sendEmail(correo, newPassword);

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
})

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
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Correo electrónico enviado: " + info.response);
    }
  });
}

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

// Editar usuario
app.put("/EditarUsuario/:id", function (req, res) {
  const userID = req.params.id;
  const updatedData = req.body;

  // Buscar el usuario por su ID
  Usuario.findByPk(userID)
    .then((usuario) => {
      if (usuario) {
        // Actualizar los datos del usuario con los nuevos datos
        usuario.update(updatedData)
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
    subject: "Solicitud de seguimiento del seguro con folio: " + req.body.folio,
    text:
      'Buen dia, se le solicita una actualizacion sobre la solicitud con folio "' +
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
          retroalimentacion_Actual:
            estatusLexico[req.body.nuevoEstatus] + ". " + req.body.retroNueva,
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
app.post("/UploadDocuments", upload.any("pdf"), function (req, res) {
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
});

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

//Alta de estudiantes
app.post("/AltaEstudiante", function (req, res) {
  Usuario.create({
      matricula: req.body.matriculaUser,
      nombre_Completo: req.body.nombreUser,
      contraseña: req.body.contraseñaUser,
      correo_e: req.body.correoUser
  })
    .then((result) => {
      Estudiante.create({
          matricula_Estudiante: req.body.matriculaUser,
          carrera: req.body.carreraUser,
          semestre: req.body.semestreUser
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

//Alta de encargados
app.post("/AltaEncargados", function (req, res) {
  Usuario.create({
      matricula: req.body.matriculaUser,
      nombre_Completo: req.body.nombreUser,
      contraseña: req.body.contraseñaUser,
      correo_e: req.body.correoUser
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

//Funcion de busqueda de Encargada
app.post("/searchEncargada", function (req, res) {
  Usuario.findAll({
    where: {matricula: req.body.matriculaUser},
    attributes: [
      "nombre_Completo",
      "correo_e",
    ]
    })
    .then((result) => {
      Estudiante.count({
        where: {matricula_Estudiante: req.body.matriculaUser}
      })
      .then((resultado) => {
        console.log(resultado)
        if(resultado == 0){
          res.send({result, Code: 1})
        }
        else{
          res.send({Code: -1})
        }
      })
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    })
});

//Funcion de busqueda de Alumnos
app.post("/searchAlumno", function (req, res) {
  Estudiante.findAndCountAll({
    where: {matricula_Estudiante: req.body.matriculaUser},
    attributes: [
      "carrera",
      "semestre",
    ]
    })
    .then((result) => {
      let datos = result.rows;
      let cantidad = result.count
      Usuario.findAll({
        where: {matricula: req.body.matriculaUser},
        attributes: [
          "nombre_Completo",
          "correo_e",
        ]
        })
        .then((result) => {
          if(cantidad == 1){
            res.send({result, datos, Code: 1})
          }
          else{
            res.send({Code: -1})
          }
        })
        .catch((error) => {
          console.log(error);
          res.send({ Code: -1 });
        })
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    })
});

//Inicializar el servidor
app.listen(PORT, function () {
  //Conectarse a la base de datos al iniciar el servidor
  sequelize
    .authenticate()
    .then(() => {
      sequelize.sync().then(() => console.log("Conexion exitosa"));
    })
    .catch((error) => console.log("Error de conexion: ", error));
});
