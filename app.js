//Dependencias
const express = require("express");
const app = express();
const sequelize = require("./Database/db");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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

//Prueba
app.get("/", function (req, res) {
  res.send("Patata");
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
