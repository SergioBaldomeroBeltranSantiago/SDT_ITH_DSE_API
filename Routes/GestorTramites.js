//Imports
const express = require("express");
const router = express.Router();
const cors = require("cors");

//Models
const Tramite = require("../Database/Models/Tramite");
const Tramite_M = require("../Database/Models/Tramite_M");

//CORS
router.use(cors());

//Middleware
router.use(express.json({ limit: "10mb" }));
router.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Envia todos los trámites existentes en formato de lista, para un botón de selección utilizado para la administración de los trámites
router.get("/lista", function (req, res) {
  Tramite.findAll({ attributes: ["id_Tramite", "nombre_Tramite"] })
    .then((resultado) => {
      res.send(resultado);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: 0 });
    });
});

//Envia toda la información y requisitos pertenecientes a un trámite en particular, para su posterior edición
router.post("/detalles", function (req, res) {
  Tramite.findAll({
    attributes: ["id_Tramite", "nombre_Tramite"],
    include: {
      model: Tramite_M,
    },
    where: {
      id_Tramite: req.body.ID_Tramite,
    },
  })
    .then((resultado) => {
      res.send(resultado);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: 0 });
    });
});

//Envia toda la información y requisitos pertenecientes a un trámite en particular, para su posterior edición
router.post("/actualizar", function (req, res) {
  Tramite_M.update(
    { texto: req.body.contenido },
    { where: { id_Tramite_M: req.body.id_metadata } }
    )
    .then((resultado) => {
      res.send({Code:1});
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: 0 });
    });
});

module.exports = router;
