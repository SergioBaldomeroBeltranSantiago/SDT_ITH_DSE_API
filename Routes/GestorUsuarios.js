//Dependencias
const express = require("express");
const router = express.Router();
const cors = require("cors");
const winston = require("winston");

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Estudiante = require("../Database/Models/Estudiante");

//CORS
router.use(cors());

//Middleware
router.use(
  express.json({
    limit: "10mb",
  })
);
router.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

//Errores
const registrarError = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

const handleError = (error, req, res, next) => {
  registrarError(error);
  res.sendStatus(500);
};

router.use(handleError);

//Login
router.get("/sesion", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarContraseña = new RegExp("^[0-9]{3,8}");

    //Validamos que la información tenga los datos apropiados.
    if (
      validarContraseña.test(req.query.contraseña) &&
      (validarMatriculaEstudiante.test(req.query.matricula) ||
        validarMatriculaEncargada.test(req.query.matricula))
    ) {
      //Buscamos un usuario que coincida con la matricula y contraseña ingresadas.
      const usuario = await Usuario.findOne({
        where: {
          matricula: req.query.matricula,
          contraseña: req.query.contraseña,
        },
      });

      //Enviamos un status 200 si el usuario fue encontrado.
      //Enviamos un status 404 si el usuario no fue encontrado.
      res.sendStatus(usuario ? 200 : 404);
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Conseguir datos del usuario
router.get("/consultar", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");

    //Validamos que la información tenga los datos apropiados.
    if (
      validarMatriculaEstudiante.test(req.query.matricula) ||
      validarMatriculaEncargada.test(req.query.matricula)
    ) {
      //Buscamos al usuario de acuerdo a la matricula ingresada.
      const usuario = await Usuario.findByPk(req.query.matricula, {
        include: {
          model: Estudiante,
        },
        attributes: ["matricula", "nombre_Completo", "correo_e"],
      });

      //Enviamos un status 200 si el usuario fue encontrado.
      //Enviamos un status 404 si el usuario no fue encontrado.
      //Enviamos ademas, la información del usuario en caso de haberlo encontrado.
      usuario
        ? res.status(200).send({ Informacion: usuario })
        : res.sendStatus(404);
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Crear un nuevo usuario individual
//Aun no esta terminada.
router.post("/nueva", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarNombreApellido = new RegExp(
      "^(?!$)[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]{2,}( [A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)?$"
    );
    var validarCorreoElectronico = new RegExp(
      "^(?!$)[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\\.[A-Za-z]{2,}(.[A-Za-z]{2,})?$"
    );

    //Checamos si los datos recibidos tienen el formato valido.
    if (
      (validarMatriculaEstudiante.test(req.body.matricula) ||
        validarMatriculaEncargada.test(req.body.matricula)) &&
      validarNombreApellido.test(req.body.nombre_Completo) &&
      validarCorreoElectronico.test(req.body.correo_e) &&
      req.body.semestre > 0 &&
      req.body.semestre < 15
    ) {
      //Buscamos al usuario, para ver si existe.
      const usuario = await Usuario.findByPk(req.body.matricula, {
        include: [{ model: Estudiante }],
      });
      if (!usuario) {
        //Si no existe, se crea.
        const usuarioNuevo = await Usuario.create({
          matricula: req.body.matricula,
          nombre_Completo: req.body.nombre_Completo,
          contraseña: req.body.matricula,
          correo_e: req.body.matricula,
          Estudiante: {
            carrera: req.body.Estudiante.carrera,
            semestre: req.body.Estudiante.semestre,
          },
        });

        res.sendStatus(usuarioNuevo ? 200 : 404);
      } else {
        //Si se encuentra, se actualiza
        const usuarioActualizado = await usuario.update({
          matricula: req.body.nuevaMatricula ?? req.body.matricula,
          nombre_Completo: req.body.nombre_Completo,
          contraseña: req.body.matricula,
          correo_e: req.body.matricula,
          Estudiante: {
            carrera: req.body.Estudiante.carrera,
            semestre: req.body.Estudiante.semestre,
          },
        });
        res.sendStatus(usuarioActualizado ? 200 : 404);
      }
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualizar un usuario
router.put("/actualizar", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarNombreApellido = new RegExp(
      "^(?!$)[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]{2,}( [A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)?$"
    );
    var validarContraseña = new RegExp("^[0-9]{3,8}");
    var validarCorreoElectronico = new RegExp(
      "^(?!$)[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\\.[A-Za-z]{2,}(.[A-Za-z]{2,})?$"
    );

    var validacionMatricula =
      validarMatriculaEstudiante.test(req.body.matricula) ||
      validarMatriculaEncargada.test(req.body.matricula);

    var validacionNuevaMatricula = req.body.nuevaMatricula
      ? req.body.nuevaMatricula === ""
        ? true
        : validarMatriculaEstudiante.test(req.body.nuevaMatricula) ||
          validarMatriculaEncargada.test(req.body.nuevaMatricula)
      : true;

    var validacionContraseña = req.body.contraseña
      ? req.body.contraseña === ""
        ? true
        : validarContraseña.test(req.body.contraseña)
      : true;

    var validacionNuevaContraseña = req.body.nuevaContraseña
      ? req.body.nuevaContraseña === ""
        ? true
        : validarContraseña.test(req.body.nuevaContraseña)
      : true;

    var validacionNombreApellido = req.body.nombre_Completo
      ? req.body.nombre_Completo === ""
        ? true
        : validarNombreApellido.test(req.body.nombre_Completo)
      : true;

    var validacionCorreoElectronico = req.body.correo_e
      ? req.body.correo_e === ""
        ? true
        : validarCorreoElectronico.test(req.body.correo_e)
      : true;

    var validacionSemestre = req.body.semestre
      ? req.body.semestre > 0 && req.body.semestre < 15
      : true;

    if (
      validacionMatricula &&
      validacionNuevaMatricula &&
      validacionNombreApellido &&
      validacionContraseña &&
      validacionNuevaContraseña &&
      validacionCorreoElectronico &&
      validacionSemestre
    ) {
      //Buscamos el usuario que coincida con la matricula y contraseña
      const usuarioActual = await Usuario.findOne({
        where: {
          matricula: req.body.matricula,
        },
        include: [{ model: Estudiante }],
      });

      if (usuarioActual) {
        var usuarioActualizado = await usuarioActual.update({
          correo_e:
            req.body.correo_e === ""
              ? usuarioActual.correo_e
              : req.body.correo_e,
          contraseña:
            req.body.nuevaContraseña === ""
              ? usuarioActual.contraseña
              : req.body.nuevaContraseña,
        });

        if (usuarioActual.Estudiante) {
          usuarioActualizado = await usuarioActual.update({
            Estudiante: {
              carrera:
                req.body.carrera === ""
                  ? usuarioActual.Estudiante.carrera
                  : req.body.carrera,
              semestre: req.body.semestre
                ? req.body.semestre
                : usuarioActual.Estudiante.semestre,
            },
          });

          res.status(200).send(usuarioActualizado);
        }
      } else {
        res.sendStatus(404);
      }
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualiza solo la contraseña
router.put("/contraseña", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");

    if (
      validarMatriculaEstudiante.test(req.body.matricula) ||
      validarMatriculaEncargada.test(req.body.matricula)
    ) {
      const usuario = await Usuario.findByPk(req.body.matricula);
      if (usuario) {
        const usuarioNuevaContraseña = await usuario.update({
          contraseña: req.body.matricula,
        });
        //Enviamos un status 200 si el usuario fue actualizado.
        //Enviamos un status 400 si el usuario no fue actualizado.
        res.sendStatus(usuarioNuevaContraseña ? 200 : 400);
      } else {
        //Enviamos un status 404 si el usuario no fue encontrado.
        res.sendStatus(404);
      }
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

module.exports = router;
