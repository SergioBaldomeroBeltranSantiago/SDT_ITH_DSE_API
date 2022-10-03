//Import
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");

const Usuario = require("./Database/Models/Usuario");
const Estudiante = require("./Database/Models/Estudiante");
const Tramite = require("./Database/Models/Tramite");
const Imagen = require("./Database/Models/Imagen");
const Tramite_M = require("./Database/Models/Tramite_M");
const Solicitud = require("./Database/Models/Solicitud");
const Documento = require("./Database/Models/Documento");
const Solicitud_Bitacora = require("./Database/Models/Solicitud_Bitacora");

//Definimos el puerto a utilizar
const PORT = process.env.PORT || 3001;

//CORS
app.use(cors());

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Rutas
app.get("/", function (req, res) {
  res.send("Patata");
});

//Login
app.post("/Login", function (req, res) {
  //Buscar si existe el registro de usuario
  Usuario.findByPk(req.body.id_number).then((result) => {
    //Si si existe, checar si coincide usuario y contraseña
    if (result != null) {
      Usuario.count({
        where: {
          matricula: req.body.id_number,
          contraseña: req.body.password,
        },
      }).then((consult) => {
        if (consult > 0) {
          //Si si coinciden, pasa
          res.send({ Code: 1 });
        } else {
          //Si no coinciden, tronasion
          res.send({ Code: -1 });
        }
      });
    } else {
      //Si no existe, tronasion
      res.send({ Code: 0 });
    }
  });
});

//Conseguir datos del usuario activo en sesión, si es admin
app.post("/AdminInfo", function (req, res) {
  console.log(req.body.loginID);
  Usuario.findAll({
    attributes: ["matricula", "nombre_C", "correo_e"],
    where: { matricula: req.body.loginID },
  }).then((consult) => {
    res.send(consult);
  });
});

//Conseguir datos del usuario activo en sesión, si es estudiante
app.post("/StudentInfo", function (req, res) {
  Usuario.findAll({
    attributes: ["matricula", "nombre_C", "correo_e"],
    where: { matricula: req.body.loginID },
    include: [{ model: Estudiante, attributes: ["carrera", "semestre"] }],
  }).then((consult) => {
    res.send(consult);
  });
});

//Conseguir la lista de Solicitudes en el sistema, filtrada según el estatus
app.post("/RequestList", function (req, res) {
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
  }).then((consult) => {
    res.send(consult);
  });
});

//Inicializar el servidor
app.listen(PORT, function () {
  console.log("http://localhost:" + PORT);

  //Conectarse a la base de datos al iniciar el servidor
  sequelize
    .authenticate()
    .then(() => {
      sequelize.sync({ alter: true }).then(() => {
        console.log("Conectao");
      });
    })
    .catch((error) => console.log("No conectao pq: ", error));
});
