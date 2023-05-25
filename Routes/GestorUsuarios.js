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
      console.log(usuario);
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

  console.log(listaEstudiantesEliminar);
};

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
            matricula: req.body.matricula,
            nombre_Completo: req.body.nombre_Completo,
            contraseña: req.body.matricula,
            correo_e: req.body.correo_e,
            hasTramiteOrActualizado: true,
          });
          await Estudiante.create({
            carrera: req.body.Estudiante.carrera,
            semestre: req.body.Estudiante.semestre,
            matricula_Estudiante: req.body.matricula,
          });
          res.sendStatus(200);
        } else {
          await Usuario.create({
            matricula: req.body.matricula,
            nombre_Completo: req.body.nombre_Completo,
            contraseña: req.body.matricula,
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
            contraseña: req.body.contraseña,
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
            contraseña: req.body.contraseña,
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
    //Cualquier error del sistema, se envia un status 500, se crea un log dentro del servidor.
    next(error);
  }
});

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

//Actualiza solamente a un registro de usuario.
const actualizarUsuario = async (
  usuarioEncontrado,
  nuevaMatricula,
  contraseña,
  nuevaContraseña,
  correo_e,
  nombre_Completo
) => {
  const actualizarNombreCompleto =
    nombre_Completo || usuarioEncontrado.nombre_Completo;
  const actualizarCorreoElectronico = correo_e || usuarioEncontrado.correo_e;
  const actualizarContraseña =
    nuevaContraseña || contraseña || usuarioEncontrado.contraseña;
  const actualizarMatricula = nuevaMatricula || usuarioEncontrado.matricula;

  console.log(actualizarMatricula);

  await usuarioEncontrado.update({
    nombre_Completo: String(actualizarNombreCompleto),
    correo_e: String(actualizarCorreoElectronico),
    contraseña: String(actualizarContraseña),
    matricula: String(actualizarMatricula),
    hasTramiteOrActualizado: true,
  });

  const actualizarUsuario = await Usuario.findByPk(
    String(usuarioEncontrado.matricula)
  );

  console.log(actualizarUsuario);

  return actualizarUsuario;
};

//Actualiza solamente a un registro de estudiante.
const actualizarEstudiante = async (
  estudianteEncontrado,
  estudianteDatosActualizados
) => {
  console.log("EL USUARIO ES UN ESTUDIANTE");
  const actualizarCarrera =
    estudianteDatosActualizados.carrera || estudianteEncontrado.carrera;
  const actualizarSemestre =
    estudianteDatosActualizados.semestre || estudianteEncontrado.semestre;

  console.log("SE ESTABLECIERON LOS PARAMETROS PARA LA ACTUALIZACION");
  await estudianteEncontrado.update({
    carrera: actualizarCarrera,
    semestre: actualizarSemestre,
    matricula_Estudiante:
      estudianteDatosActualizados.nuevaMatricula ??
      estudianteDatosActualizados.matricula,
  });
  console.log("SE HA ACTUALIZAO");
};

//Actualizar un usuario
router.put("/actualizar", async function (req, res, next) {
  console.log(req.body);
  try {
    //Validaciones.
    var validarMatriculaEstudiante = new RegExp("^(B|b|C|c|D|d|M|m)?[0-9]{8}$");
    var validarMatriculaEncargada = new RegExp("^[0-9]{3}$");
    var validarContraseña = new RegExp("^[0-9]{3,8}");
    var validarCorreoElectronico = new RegExp(
      "^(?!$)[A-Za-z0-9]+([._-][A-Za-z0-9]+)*@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\\.[A-Za-z]{2,}(.[A-Za-z]{2,})?$"
    );

    var validacionMatricula =
      validarMatriculaEstudiante.test(req.body.matricula) ||
      validarMatriculaEncargada.test(req.body.matricula);

    var validacionNuevaMatricula = req.body.nuevaMatricula
      ? req.body.nuevaMatricula !== ""
        ? validarMatriculaEstudiante.test(req.body.nuevaMatricula) ||
          validarMatriculaEncargada.test(req.body.nuevaMatricula)
        : true
      : true;

    var validacionContraseña = req.body.contraseña
      ? req.body.contraseña !== ""
        ? validarContraseña.test(req.body.contraseña)
        : true
      : true;

    var validacionNuevaContraseña = req.body.nuevaContraseña
      ? req.body.nuevaContraseña !== ""
        ? validarContraseña.test(req.body.nuevaContraseña)
        : true
      : true;

    var validacionCorreoElectronico = req.body.correo_e
      ? req.body.correo_e !== ""
        ? validarCorreoElectronico.test(req.body.correo_e)
        : true
      : true;

    var validacionSemestre = req.body.Estudiante.semestre
      ? req.body.Estudiante.semestre > 0 && req.body.Estudiante.semestre < 15
      : true;

    if (
      validacionMatricula &&
      validacionNuevaMatricula &&
      validacionContraseña &&
      validacionNuevaContraseña &&
      validacionCorreoElectronico &&
      validacionSemestre
    ) {
      //Buscamos el usuario que coincida con la matricula y contraseña
      const usuarioActual = await Usuario.findOne({
        where: {
          matricula: String(req.body.matricula),
        },
        include: [{ model: Estudiante }],
      });

      //Preguntamos si el usuario en cuestion existe
      if (usuarioActual) {
        //Vamos a checar que valores utilizaremos
        const nombre_CompletoActualizar =
          req.body.nombre_Completo || usuarioActual.nombre_Completo;

        const correo_eActualizar = req.body.correo_e || usuarioActual.correo_e;

        const contraseñaActualizar =
          req.body.nuevaContraseña ||
          req.body.contraseña ||
          usuarioActual.contraseña;

        const matriculaActualizar =
          req.body.nuevaMatricula || req.body.matricula;

        const usuarioActualizar = await usuarioActual.update({
          nombre_Completo: nombre_CompletoActualizar,
          correo_e: correo_eActualizar,
          contraseña: contraseñaActualizar,
          matricula: matriculaActualizar,
          hasTramiteOrActualizado: true,
        });

        var carreraActualizar;

        if (usuarioActual.Estudiante) {
          const estudianteActualizado = await Estudiante.update(
            {
              carrera:
                req.body.Estudiante.carrera !== ""
                  ? req.body.Estudiante.carrera
                  : usuarioActual.Estudiante.carrera,
              semestre:
                req.body.Estudiante.semestre > 0 &&
                req.body.Estudiante.semestre < 15
                  ? req.body.Estudiante.semestre
                  : usuarioActual.Estudiante.semestre,
              matricula_Estudiante:
                req.body.nuevaContraseña ?? req.body.matricula,
            },
            {
              where: {
                matricula_Estudiante:
                  req.body.nuevaContraseña ?? req.body.matricula,
              },
            }
          );

          console.log("Enviando respuesta");
          estudianteActualizado
            ? res.status(200).send(estudianteActualizado)
            : res.sendStatus(404);
          return;
        }

        usuarioActualizar
          ? res.status(200).send(usuarioActualizar)
          : res.sendStatus(404);
        return;
      } else {
        //Devolvemos un error 404 si el usuario en cuestion no existe
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

router.put("/actualizarTest", async function (req, res, next) {
  try {
    const datosEntrada = {
      matricula: req.body.matricula,
      nuevaMatricula: req.body.nuevaMatricula,
      contraseña: req.body.contraseña,
      nuevaContraseña: req.body.nuevaContraseña,
      correo_e: req.body.correo_e,
      Estudiante: req.body.Estudiante,
    };

    const usuarioEncontrado = await Usuario.findOne({
      where: { matricula: String(datosEntrada.matricula) },
      include: [{ model: Estudiante }],
    });

    if (usuarioEncontrado) {
      //Actualizar el usuario.
      const actualizarUsuarioEncontrado = await actualizarUsuario(
        usuarioEncontrado,
        datosEntrada.nuevaMatricula,
        datosEntrada.contraseña,
        datosEntrada.nuevaContraseña,
        datosEntrada.correo_e
      );

      console.log(actualizarUsuarioEncontrado);

      console.log("SE PREGUNTA SI EL USUARIO ES ESTUDIANTE");
      //Preguntamos si este usuario tiene un registro de estudiante asociado, ya que este tambien debera ser actualizado.
      if (actualizarUsuarioEncontrado)
        await actualizarEstudiante(
          actualizarUsuarioEncontrado.Estudiante,
          datosEntrada.Estudiante
        );

      //Se envia la respuesta como un estatus 200
      res.status(200).send(actualizarUsuarioEncontrado);
    } else {
      console.log("NO SE ENCONTRO EL USUARIO");
      //Se envia el estatus 404 en caso de que el usuario no exista
      res.sendStatus(404);
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
