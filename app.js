//Import
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");

const Usuario = require("./Database/Models/Usuario");

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

//Inicializar el servidor
app.listen(PORT, function () {
  console.log("http://localhost:" + PORT);

  //Conectarse a la base de datos al iniciar el servidor
  sequelize
    .authenticate()
    .then(() => {
      sequelize.sync({ force: true });
      console.log("Conectao");
    })
    .catch((error) => console.log("No conectao pq: ", error));
});
