//Dependencias
const express = require("express");
const router = express.Router();
const cors = require("cors");
const winston = require("winston");

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Estudiante = require("../Database/Models/Estudiante");
const Solicitud = require("../Database/Models/Solicitud");

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

//Preparar usuarios estudiantes para actualizacion masiva
const prepararEstudiantes = async () => {
  const listaEstudiantes = await Usuario.findAll({
    include: [{ model: Estudiante }],
  });

  for (var indice = 0; indice < listaEstudiantes.length; indice++) {
    if (listaEstudiantes[indice].Estudiante !== null) {
      await listaEstudiantes[indice].update({
        hasTramiteOrActualizado: false,
      });
    }
  }
};

//Parte de alta masiva, invoca a preprararEstudiantes
router.get("/preparar", async function (req, res, next) {
  try {
    prepararEstudiantes();
    res.sendStatus(200);
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Busca usuarios estudiantes, si estos no tienen una solicitud, ya sea en proceso o finalizada, se eliminan
const eliminarEstudiantes = async () => {
  const listaEstudiantes = await Usuario.findAll({
    include: [{ model: Estudiante }],
    where: { hasTramiteOrActualizado: false },
  });

  var listaEstudiantesEliminar = [];

  for (var indice = 0; indice < listaEstudiantes.length; indice++) {
    if (listaEstudiantes[indice].Estudiante !== null) {
      var listaSolicitudesEstudiante = await Solicitud.findAll({
        where: { estudiante_Solicitante: listaEstudiantes[indice].matricula },
      });

      if (!listaSolicitudesEstudiante.length > 0)
        listaEstudiantesEliminar.push(listaEstudiantes[indice]);
    }
  }

  for (var indice = 0; indice < listaEstudiantesEliminar.length; indice++) {
    await Usuario.destroy({
      where: { matricula: listaEstudiantesEliminar[indice].matricula },
    });
  }
};

//Parte de alta masiva, invoca a eliminarEstudiantes
router.get("/eliminar", async function (req, res, next) {
  try {
    eliminarEstudiantes();
    res.sendStatus(200);
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Crear un nuevo usuario, alta masiva
router.post("/nuevo", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarCorreoElectronico = new RegExp(
      "^(?!$)[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\\.[A-Za-z]{2,}(.[A-Za-z]{2,})?$"
    );
    var validarSemestre = req.body.Estudiante
      ? req.body.Estudiante.semestre > 0 && req.body.Estudiante.semestre < 15
      : true;

    //Checamos si los datos recibidos tienen el formato valido.
    if (
      (validarMatriculaEstudiante.test(req.body.matricula) ||
        validarMatriculaEncargada.test(req.body.matricula)) &&
      validarCorreoElectronico.test(req.body.correo_e) &&
      validarSemestre
    ) {
      //Buscamos al usuario, para ver si existe.
      const usuario = await Usuario.findByPk(String(req.body.matricula), {
        include: [{ model: Estudiante }],
      });

      if (!usuario) {
        //Si no existe, se crea.
        if (req.body.Estudiante !== null) {
          await Usuario.create({
            matricula:
              req.body.matricula.length === 9
                ? String(req.body.matricula).charAt(0).toUpperCase() +
                  String(req.body.matricula).slice(1)
                : String(req.body.matricula),
            nombre_Completo: req.body.nombre_Completo,
            contraseña:
              req.body.matricula.length === 9
                ? String(req.body.matricula).slice(1)
                : String(req.body.matricula),
            correo_e: req.body.correo_e,
            hasTramiteOrActualizado: true,
          });
          await Estudiante.create({
            carrera: req.body.Estudiante.carrera,
            semestre: req.body.Estudiante.semestre,
            matricula_Estudiante:
              req.body.matricula.length === 9
                ? String(req.body.matricula).charAt(0).toUpperCase() +
                  String(req.body.matricula).slice(1)
                : String(req.body.matricula),
          });
          res.sendStatus(200);
        } else {
          await Usuario.create({
            matricula:
              req.body.matricula.length === 9
                ? String(req.body.matricula).charAt(0).toUpperCase() +
                  String(req.body.matricula).slice(1)
                : String(req.body.matricula),
            nombre_Completo: req.body.nombre_Completo,
            contraseña:
              req.body.matricula.length === 9
                ? String(req.body.matricula).slice(1)
                : String(req.body.matricula),
            correo_e: req.body.correo_e,
            hasTramiteOrActualizado: true,
          });
          res.sendStatus(200);
        }
      } else {
        //Si se encuentra, se actualiza
        if (req.body.Estudiante !== null) {
          await usuario.update({
            matricula: req.body.nuevaMatricula ?? usuario.matricula,
            nombre_Completo: req.body.nombre_Completo,
            correo_e: req.body.correo_e,
            hasTramiteOrActualizado: true,
          });
          await Estudiante.update(
            {
              carrera: req.body.Estudiante.carrera,
              semestre: req.body.Estudiante.semestre,
              matricula_Estudiante: req.body.matricula,
            },
            { where: { matricula_Estudiante: String(req.body.matricula) } }
          );
          res.sendStatus(200);
        } else {
          await usuario.update({
            matricula: req.body.nuevaMatricula ?? req.body.matricula,
            nombre_Completo: req.body.nombre_Completo,
            correo_e: req.body.correo_e,
            hasTramiteOrActualizado: true,
          });
          res.sendStatus(200);
        }
      }
    } else {
      //Enviamos un status 400 si los datos ingresados no cumplen con el formato valido.
      res.sendStatus(400);
    }
  } catch (error) {
    console.log(error);
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualizar un usuario, si se quiere cambiar la matricula
const actualizarUsuarioCambiarMatricula = async (
  UsuarioActual,
  ParametrosEntrada
) => {
  try {
    const checarInexistencia = await Usuario.findByPk(
      ParametrosEntrada.nuevaMatricula
    );
    if (checarInexistencia) return Number(0);

    //Creamos un usuario "temporal"
    const nuevoUsuario = await Usuario.create({
      matricula: ParametrosEntrada.nuevaMatricula,
      nombre_Completo:
        ParametrosEntrada.nombre_Completo !== ""
          ? ParametrosEntrada.nombre_Completo
          : UsuarioActual.nombre_Completo,
      correo_e:
        ParametrosEntrada.correo_e !== ""
          ? ParametrosEntrada.correo_e
          : UsuarioActual.correo_e,
      hasTramiteOrActualizado: true,
    });

    //Preguntamos si el usuario original tenia asociado un registro de Estudiante
    if (ParametrosEntrada.Estudiante) {
      //Si esto es cierto, actualizamos el registro para que apunte al usuario "temporal"
      await Estudiante.update(
        {
          carrera:
            ParametrosEntrada.Estudiante.carrera !== ""
              ? ParametrosEntrada.Estudiante.carrera
              : UsuarioActual.Estudiante.carrera,
          semestre:
            ParametrosEntrada.Estudiante.semestre !== ""
              ? ParametrosEntrada.Estudiante.semestre
              : UsuarioActual.Estudiante.semestre,
          matricula_Estudiante: ParametrosEntrada.nuevaMatricula,
        },
        { where: { matricula_Estudiante: UsuarioActual.matricula } }
      );

      //Dado que si tiene un registro de Estudiante asociado, es posible que tambien tenga registros de Solicitud asociados, y hay que cambiarlos para que apunten al nuevo usuario "temporal"
      await Solicitud.update(
        {
          estudiante_Solicitante: ParametrosEntrada.nuevaMatricula,
        },
        { where: { estudiante_Solicitante: UsuarioActual.matricula } }
      );
    }

    //Sea el caso que tenga o tenga otros registros asociados, lo que queda al final es simplemente eliminar el usuario "antiguo"
    await Usuario.destroy({
      where: {
        matricula: UsuarioActual.matricula,
      },
    });

    return Number(1);
  } catch (error) {
    return Number(-1);
  }
};

//Actualizar un usuario, si no se quiere cambiar la matricula
const actualizarUsuarioMantenerMatricula = async (
  UsuarioActual,
  ParametrosEntrada
) => {
  try {
    //Actualizamos el usuario
    await Usuario.update(
      {
        nombre_Completo:
          ParametrosEntrada.nombre_Completo !== ""
            ? ParametrosEntrada.nombre_Completo
            : UsuarioActual.nombre_Completo,
        correo_e:
          ParametrosEntrada.correo_e !== ""
            ? ParametrosEntrada.correo_e
            : UsuarioActual.correo_e,
        hasTramiteOrActualizado: true,
      },
      { where: { matricula: UsuarioActual.matricula } }
    );

    //Preguntamos si hay registro de Estudiante asociado al usuario recien actualizado
    if (ParametrosEntrada.Estudiante) {
      //Si existe este registro de Estudiante, se actualiza tambien
      await Estudiante.update(
        {
          carrera:
            ParametrosEntrada.Estudiante.carrera !== ""
              ? ParametrosEntrada.Estudiante.carrera
              : UsuarioActual.Estudiante.carrera,
          semestre:
            ParametrosEntrada.Estudiante.semestre !== ""
              ? ParametrosEntrada.Estudiante.semestre
              : UsuarioActual.Estudiante.semestre,
        },
        { where: { matricula_Estudiante: UsuarioActual.matricula } }
      );
    }

    //Se envia un status de 200, indicando que la actualizacion fue exitosa
    return Number(1);
  } catch (error) {
    return Number(-1);
  }
};

//Actualiza un usuario y sus registros asociados
router.put("/actualizar", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarContraseña = new RegExp("^[0-9]{3,8}");
    var validarCorreoElectronico = new RegExp(
      "^(?!$)[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\\.[A-Za-z]{2,}(.[A-Za-z]{2,})?$"
    );

    //Comprobar validaciones.
    const validacionMatricula =
      validarMatriculaEstudiante.test(String(req.body.matricula)) ||
      validarMatriculaEncargada.test(String(req.body.matricula));

    const validacionNuevaMatricula =
      req.body.nuevaMatricula !== undefined
        ? req.body.nuevaMatricula !== ""
          ? validarMatriculaEstudiante.test(String(req.body.nuevaMatricula)) ||
            validarMatriculaEncargada.test(String(req.body.nuevaMatricula))
          : true
        : true;

    const validacionContraseña =
      req.body.contraseña !== undefined
        ? req.body.contraseña !== "" &&
          validarContraseña.test(String(req.body.contraseña))
        : true;

    const validacionNuevaContraseña =
      req.body.nuevaContraseña !== undefined
        ? req.body.nuevaContraseña !== ""
          ? validarContraseña.test(String(req.body.nuevaContraseña))
          : true
        : true;

    const validacionCorreoElectronico =
      req.body.correo_e !== undefined
        ? req.body.correo_e !== ""
          ? validarCorreoElectronico.test(String(req.body.correo_e))
          : true
        : true;

    const validacionSemestre =
      req.body.Estudiante !== undefined && req.body.Estudiante !== null
        ? req.body.Estudiante.semestre !== undefined
          ? req.body.Estudiante.semestre !== ""
            ? Number(req.body.Estudiante.semestre) > 0 &&
              Number(req.body.Estudiante.semestre) < 15
            : true
          : true
        : true;

    const validacionParametrosEntrada =
      validacionMatricula &&
      validacionNuevaMatricula &&
      validacionContraseña &&
      validacionNuevaContraseña &&
      validacionCorreoElectronico &&
      validacionSemestre;

    //Checamos si los datos de entrada tienen el formato valido.
    if (validacionParametrosEntrada) {
      //Parametros de entrada ya validados
      const matriculaEntrada =
        req.body.matricula.length === 9
          ? String(req.body.matricula).charAt(0).toUpperCase() +
            String(req.body.matricula).slice(1)
          : String(req.body.matricula);

      const nuevaMatriculaEntrada =
        req.body.nuevaMatricula !== undefined
          ? req.body.nuevaMatricula !== ""
            ? req.body.nuevaMatricula.length === 9
              ? String(req.body.nuevaMatricula).charAt(0).toUpperCase() +
                String(req.body.nuevaMatricula).slice(1)
              : String(req.body.nuevaMatricula)
            : ""
          : "";

      const nombreCompletoEntrada =
        req.body.nombre_Completo !== undefined
          ? req.body.nombre_Completo !== ""
            ? String(req.body.nombre_Completo)
            : ""
          : "";

      const contraseñaEntrada =
        req.body.contraseña !== undefined
          ? req.body.contraseña !== ""
            ? String(req.body.contraseña)
            : ""
          : "";

      const nuevaContraseñaEntrada =
        req.body.nuevaContraseña !== undefined
          ? req.body.nuevaContraseña !== ""
            ? String(req.body.nuevaContraseña)
            : ""
          : "";

      const correoElectronicoEntrada =
        req.body.correo_e !== undefined
          ? req.body.correo_e !== ""
            ? String(req.body.correo_e)
            : ""
          : "";

      const estudianteEntrada =
        req.body.Estudiante !== undefined && req.body.Estudiante !== null
          ? req.body.Estudiante.carrera !== undefined &&
            req.body.Estudiante.semestre !== undefined
            ? {
                carrera:
                  req.body.Estudiante.carrera !== ""
                    ? String(req.body.Estudiante.carrera)
                    : "",
                semestre:
                  req.body.Estudiante.semestre !== ""
                    ? Number(req.body.Estudiante.semestre)
                    : "",
              }
            : null
          : null;

      const parametrosEntrada = {
        matricula: matriculaEntrada,
        nuevaMatricula: nuevaMatriculaEntrada,
        nombre_Completo: nombreCompletoEntrada,
        contraseña: contraseñaEntrada,
        nuevaContraseña: nuevaContraseñaEntrada,
        correo_e: correoElectronicoEntrada,
        Estudiante: estudianteEntrada,
      };

      //Verificamos si requiere contraseña para autorizar los cambios
      const necesitaContraseña =
        req.body.contraseña !== undefined
          ? req.body.contraseña !== ""
            ? true
            : false
          : false;

      //Buscamos al usuario actual, asi como se encuentra.
      const usuarioActual = necesitaContraseña
        ? await Usuario.findOne({
            where: {
              matricula: matriculaEntrada,
              contraseña: contraseñaEntrada,
            },
            include: [{ model: Estudiante }],
          })
        : await Usuario.findOne({
            where: { matricula: matriculaEntrada },
            include: [{ model: Estudiante }],
          });

      //Checamos si ese usuario existe.
      if (usuarioActual) {
        //Si existe, vamos a checar si se quiere modificar la matricula
        const cambiarMatricula =
          nuevaMatriculaEntrada !== "" &&
          matriculaEntrada !== nuevaMatriculaEntrada;

        const actualizacionExitosa = cambiarMatricula
          ? await actualizarUsuarioCambiarMatricula(
              usuarioActual,
              parametrosEntrada
            )
          : await actualizarUsuarioMantenerMatricula(
              usuarioActual,
              parametrosEntrada
            );

        switch (actualizacionExitosa) {
          case 1:
            //En caso de que si haya sido posible actualizar, enviamos status de 200 y la informacion nueva del usuario actualizado
            const matriculaConsultar = cambiarMatricula
              ? nuevaMatriculaEntrada
              : matriculaEntrada;
            const usuarioActualizado = await Usuario.findByPk(
              matriculaConsultar,
              {
                include: {
                  model: Estudiante,
                  attributes: ["carrera", "semestre"],
                },
                attributes: ["matricula", "nombre_Completo", "correo_e"],
              }
            );
            res.status(200).send(usuarioActualizado);
            break;
          case -1:
            //En caso de errores en la actualizacion, se envia el status 404
            res.sendStatus(404);
            break;
          default:
            //En caso de que la nueva matricula ya pertenezca a un usuario existente, se envia el status 409
            res.sendStatus(409);
            break;
        }
      } else {
        //Enviamos un status 404 si el usuario al que se le quieren realizar actualizaciones no existe.
        res.sendStatus(404);
      }
    } else {
      //Enviamos un status 400 por formato de datos invalidos.
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

//Actualiza solo la contraseña
router.put("/acceso", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");

    if (
      validarMatriculaEstudiante.test(String(req.body.matricula)) ||
      validarMatriculaEncargada.test(String(req.body.matricula))
    ) {
      const usuario = await Usuario.findByPk(String(req.body.matricula));
      if (usuario) {
        const usuarioNuevaContraseña = await usuario.update({
          contraseña: usuario.matricula,
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

//Dar de alta un nuevo usuario individual.
router.post("/alta", async function (req, res, next) {
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarCorreoElectronico = new RegExp(
      "^(?!$)[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\\.[A-Za-z]{2,}(.[A-Za-z]{2,})?$"
    );
    var validarSemestre = req.body.Estudiante
      ? req.body.Estudiante.semestre > 0 && req.body.Estudiante.semestre < 15
      : true;

    //Checamos si los datos recibidos tienen el formato valido.
    if (
      (validarMatriculaEstudiante.test(req.body.matricula) ||
        validarMatriculaEncargada.test(req.body.matricula)) &&
      validarCorreoElectronico.test(req.body.correo_e) &&
      validarSemestre
    ) {
      const usuarioNuevo = await Usuario.findByPk(String(req.body.matricula));

      if (usuarioNuevo) {
        res.sendStatus(409);
      } else {
        const crearUsuario = await Usuario.create({
          matricula: req.body.matricula,
          nombre_Completo: req.body.nombre_Completo,
          correo_e: req.body.correo_e,
          contraseña: req.body.matricula,
          hasTramiteOrActualizado: true,
        });

        if (crearUsuario) {
          if (req.body.Estudiante) {
            const crearEstudiante = await Estudiante.create({
              carrera: req.body.Estudiante.carrera,
              semestre: req.body.Estudiante.semestre,
              matricula_Estudiante: req.body.matricula,
            });

            res.sendStatus(crearEstudiante ? 200 : 404);
          } else {
            res.sendStatus(200);
          }
        } else {
          res.sendStatus(404);
        }
      }
    } else {
      res.sendStatus(400);
    }
  } catch (error) {
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

module.exports = router;
