//Dependencias
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const { Op } = require("sequelize");
const cors = require("cors");
const nodemailer = require("nodemailer");
const moment = require("moment");
const multer = require("multer");
const reader = require("xlsx");
const fs = require("fs");
const path = require("path");

//Enrutamiento
const GestorTramites = require("./Routes/GestorTramites");
const GestorUsuarios = require("./Routes/GestorUsuarios");
const GestorSolicitudes = require("./Routes/GestorSolicitudes");

app.use("/tramites", GestorTramites);
app.use("/usuarios", GestorUsuarios);
app.use("/solicitudes", GestorSolicitudes);

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

//Puerto
const PORT = process.env.PORT;

//CORS
app.use(cors());

//Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Correo
var transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

//Directorio
app.use(express.static(__dirname));

//Almacenamiento de archivos
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

const upload = multer({ storage }).any();

//Prueba
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
app.post("/ModificarCorreo", function (req, res) {
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
  //console.log(JSON.parse(req.body.data));
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

          //console.log(jsonInfo.titulo);
          //console.log(jsonModificar);
          //console.log(JSON.parse(req.body.data).cuerpo)

          if (jsonInfo.titulo === jsonModificar) {
            jsonInfo.asunto = JSON.parse(req.body.data).asunto;
            jsonInfo.destinatario = JSON.parse(req.body.data).destinatario;
            jsonInfo.cuerpo = JSON.parse(req.body.data).cuerpo;
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

//Se va a eliminar
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

//Se va a eliminar
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

//Inicializar el servidor
app.listen(PORT, function () {
  //Conectarse a la base de datos al iniciar el servidor
  sequelize
    .authenticate()
    .then(() => {
      sequelize
        .sync()
        .then(() => console.log("Conexion exitosa"));
    })
    .catch((error) => console.log("Error de conexion: ", error));
});
