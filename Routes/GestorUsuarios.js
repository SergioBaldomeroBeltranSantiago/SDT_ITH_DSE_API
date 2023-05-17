//Dependencias
const express = require("express");
const router = express.Router();
const cors = require("cors");

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Estudiante = require("../Database/Models/Estudiante");

//CORS
router.use(cors());

//Middleware
router.use(express.json({ limit: "10mb" }));
router.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Login
router.post("/Login", function (req, res) {
  Usuario.findByPk(req.body.id_number)
    .then((result) => {
      if (result != null) {
        Usuario.count({
          where: {
            matricula: req.body.id_number,
            contraseña: req.body.password,
          },
        })
          .then((consult) => {
            if (consult > 0) {
              res.send({ Code: 1 });
            } else {
              res.send({ Code: 0 });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        res.send({ Code: 0 });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

//Conseguir datos del usuario
router.post("/ConsultarUsuario", function (req, res) {
  Usuario.findByPk(req.body.matricula_Usuario, {
    include: { model: Estudiante },
  })
    .then((resultado) => {
      res.send(resultado);
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Subida de usuarios
router.post("/SubirUsuarios", function (req, res) {
  Usuario.findOrCreate({
    where: { matricula: req.body.UserInfo.matricula },
    defaults: {
      matricula: req.body.UserInfo.matricula,
      nombre_Completo: req.body.UserInfo.nombre_Completo,
      contraseña: req.body.UserInfo.matricula,
      correo_e: req.body.UserInfo.correoElectronico,
    },
  })
    .then(() => {
      if (req.body.UserInfo.isEstudiante) {
        Estudiante.findOrCreate({
          where: { matricula_Estudiante: req.body.matriculaUser },
          defaults: {
            matricula_Estudiante: req.body.matriculaUser,
            carrera: req.body.carreraUser,
            semestre: req.body.semestreUser,
          },
        })
          .then(() => {})
          .catch((error) => {
            console.log(error);
            res.send({ Code: -1 });
          });
      }
      res.send({ Code: 1 });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: -1 });
    });
});

//Reestablecer contraseña de usuario
router.post("/ReiniciarContraseña", function (req, res) {
  Usuario.update(
    { contraseña: req.body.matriculaUser },
    { where: { matricula: req.body.matriculaUser } }
  );
});

// Editar información de usuario
router.post("/ActualizarInformacionUsuario", function (res, res) {
  Usuario.update(
    {
      matricula: req.body.UserInfo.matricula,
      nombre_Completo: req.body.UserInfo.nombre_Completo,
      contraseña: req.body.UserInfo.contraseña,
      correo_e: req.body.UserInfo.correoElectronico,
    },
    { where: { matricula: req.body.UserInfo.matricula } }
  )
    .then((resultado) => {
      console.log(resultado);
      if (req.body.UserInfo.isEstudiante) {
        Estudiante.update(
          {
            carrera: req.body.UserInfo.carrera,
            semestre: req.body.UserInfo.semestre,
          },
          {
            where: {
              matricula_Estudiante: req.body.UserInfo.matricula,
            },
          }
        )
          .then((resultado) => {
            console.log(resultado);
          })
          .catch((error) => {
            console.log(error);
            res.send({ Code: 0 });
          });
      }
      res.send({ Code: 1 });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Code: 0 });
    });
});

module.exports = router;
