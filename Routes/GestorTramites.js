//Imports
const express = require("express");
const router = express.Router();
const cors = require("cors");
const winston = require("winston");

//Models
const Tramite = require("../Database/Models/Tramite");
const Tramite_M = require("../Database/Models/Tramite_M");
const Descripcion_Menu = require("../Database/Models/Descripcion_Menu");

//CORS
router.use(cors());

//Middleware
router.use(express.json({ limit: "10mb" }));
router.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

router.use(handleError);

//Revisitar
//Envia todos los trámites existentes en formato de lista, para un botón de selección utilizado para la administración de los trámites
router.get("/lista", async function (req, res, next) {
  try {
    const listaTramites = await Tramite.findAll({
      include: [{ model: Tramite_M }],
    });
    if (listaTramites.length > 0) {
      res.status(200).send(listaTramites);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Envia toda la información y requisitos pertenecientes a un trámite en particular, para su posterior edición
router.get("/consulta", async function (req, res, next) {
  try {
    const tramite = await Tramite.findByPk(req.query.id_Tramite, {
      include: [{ model: Tramite_M }],
    });

    tramite ? res.status(200).send(tramite) : res.sendStatus(404);
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualiza metadata de un tramite
router.post("/actualizar", async function (req, res, next) {
  try {
    const tramite_M = await Tramite_M.findByPk(req.body.Tramite_M.id_Tramite_M);

    if (tramite_M) {
      const tramite_MActualizado = await tramite_M.update({
        texto:
          req.body.Tramite_M.texto !== ""
            ? req.body.Tramite_M.texto
            : tramite_M.texto,
      });

      const tramiteMetadataActualizada = await Tramite_M.findByPk(
        req.body.Tramite_M.id_Tramite_M
      );

      tramiteMetadataActualizada
        ? res.status(200).send(tramiteMetadataActualizada)
        : res.sendStatus(400);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Conseguir datos de las descripciones para avanzar el tramite
router.get("/descripciones", async function (req, res, next) {
  try {
    const Descripciones = await Descripcion_Menu.findAll({
      where: {
        id_texto: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    });
    Descripciones.length > 0
      ? res.status(200).send(Descripciones)
      : res.sendStatus(404);
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

module.exports = router;
