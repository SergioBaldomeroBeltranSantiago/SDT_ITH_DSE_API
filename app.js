//Dependencias
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");
const errorHandler = require("./errorHandler");

//Enrutamiento
const GestorTramites = require("./Routes/GestorTramites");
const GestorUsuarios = require("./Routes/GestorUsuarios");
const GestorSolicitudes = require("./Routes/GestorSolicitudes");
const GestorCorreos = require("./Routes/GestorCorreos");

app.use("/tramites", GestorTramites);
app.use("/usuarios", GestorUsuarios);
app.use("/solicitudes", GestorSolicitudes);
app.use("/correos", GestorCorreos);

//Puerto
const PORT = process.env.PORT;

//CORS
app.use(cors());

//Manejador de errores
app.use(errorHandler);

//Prueba
app.get("/", function (req, res, next) {
  try {
    res.status(200).send("Patata");
  } catch (error) {
    //En caso de ocurrir un error, se loggea y se envia un status 500
    next(error);
  }
});

//Conectamos primero la base de datos
sequelize
  .authenticate()
  .then(() => {
    //En caso de que si podamos establecer la conexion, ahora probamos si la base de datos coincide con los modelos establecidos
    sequelize
      .sync()
      .then(() => {
        //Se pudo sincronizar correctamente, ahora iniciamos la conexion de API a Front
        app.listen(PORT, function () {
          //Informamos que la API ha sido inicializada
          console.log("API inicializada");
        });
      })
      .catch((error) => {
        //Hubo un error al sincronizar la base de datos existente con los modelos de la API, se notifica el error y se loggea
        errorHandler(error);
      });
  })
  .catch((error) => {
    //En caso de que no se pueda establecer la conexion a la base de datos, se notifica y se loguea el error
    errorHandler(error);
  });
