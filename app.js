//Import
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");
const nodemailer = require("nodemailer");
const moment = require("moment");
const multer = require("multer");

//Patron GOF - Singleton
const Usuario = require("./Database/Models/Usuario");
const Estudiante = require("./Database/Models/Estudiante");
const Tramite = require("./Database/Models/Tramite");
const Imagen = require("./Database/Models/Imagen");
const Tramite_M = require("./Database/Models/Tramite_M");
const Solicitud = require("./Database/Models/Solicitud");
const Documento = require("./Database/Models/Documento");
const Solicitud_Bitacora = require("./Database/Models/Solicitud_Bitacora");
const Operador = require("sequelize");

//Definimos el puerto a utilizar
const PORT = process.env.PORT || 3001;

//CORS
app.use(cors());

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Transportador de correo
var transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
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

//Conseguir datos del usuario activo en sesión, si es admin
app.post("/AdminInfo", function (req, res) {
  Usuario.findByPk(req.body.loginID)
    .then((result) => {
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

//Conseguir la lista de Solicitudes en el sistema, filtrada según el estatus
app.post("/RequestApplicationList", function (req, res) {
  Solicitud.findAll({
    attributes: [
      "id_S",
      "fecha_Sol",
      "fecha_Act",
      "estatus",
      "retroalimentacion",
    ],
    include: [
      { model: Usuario, attributes: ["nombre_C"] },
      { model: Tramite, attributes: ["nombre_T"] },
    ],
    where: { estatus: req.body.estatus },
    order: [
      ["fecha_Act", "ASC"],
      ["fecha_Sol", "ASC"],
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
    attributes: ["nombre_T"],
    include: [
      {
        model: Tramite_M,
        attributes: ["texto", "tipo", "orden"],
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
    text: "Aquí hay información adicional del trámite, la lista de requisitos y los documentos a llenar A COMPUTADORA",
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
  Solicitud.findOne({
    attributes: ["fecha_Sol", "fecha_Act", "estatus", "retroalimentacion"],
    include: [
      {
        model: Usuario,
        attributes: ["nombre_C"],
        where: { matricula: req.body.matriculaUsuario },
      },
      { model: Tramite, attributes: ["nombre_T"] },
    ],
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
      estudiante: req.body.matriculaUsuario,
    },
    estatus: {
      [Operador.and]: {
        [Operador.lt]: 9,
        [Operador.gt]: 0,
      },
    },
  })
    .then((consult) => {
      let hassApplication = consult > 0;
      res.send({ hassApplication });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Registrar una nueva solicitud
app.post("/NewUserApplication", function (req, res) {
  Solicitud.create({
    fecha_Sol: moment(new Date(), "YYYY-MM-DD"),
    fecha_Act: moment(new Date(), "YYYY-MM-DD"),
    estatus: 1,
    retroalimentacion: "Solicitud creada exitosamente, esperando documentos",
    estudiante: req.body.estudiante,
    tramite: "0001",
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

app.post("/UploadDocuments", function (req, res) {
  console.log(req.body);
  res.send({ Code: 0 });
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
