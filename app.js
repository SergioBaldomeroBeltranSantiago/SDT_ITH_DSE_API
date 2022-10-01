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
app.use(express.urlencoded({ extended: false }));

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
        if (consult>0) {
          //Si si coinciden, pasa
          res.sendStatus(200);
        } else {
          //Si no coinciden, tronasion
          res.sendStatus(400);
        }
      });
    } else {
      //Si no existe, tronasion
      res.sendStatus(400);
    }
  });
});

//Inicializar el servidor
app.listen(PORT, function () {
  console.log("http://localhost:" + PORT);

  //Conectarse a la base de datos al iniciar el servidor
  sequelize
    .authenticate()
    .then(() => {
      console.log("Conectao");
    })
    .catch((error) => console.log("No conectao pq: ", error));
});
