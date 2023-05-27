//Dependencias
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");
const winston = require("winston");

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

//Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

app.use(handleError);

//Prueba
app.get("/", function (req, res) {
  res.status(200).send("Patata");
});

//Inicializar el servidor
app.listen(PORT, function () {
  //Conectarse a la base de datos al iniciar el servidor
  sequelize
    .authenticate()
    .then(() => {
      sequelize
        .sync()
        .then(() => console.log("Conexion exitosa"))
        .catch((error) => {
          registrarError.error(
            "Error al sincronizar la base de datos: ",
            error
          );
        });
    })
    .catch((error) =>
      registrarError.error("Error al autentificar la base de datos: ", error)
    );
});
