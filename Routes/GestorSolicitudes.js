//Imports
//API
const express = require("express");
const router = express.Router();
//CROSS-ORIGIN-RESOURCE-SHARING
const cors = require("cors");
//Archivos y documentos
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Solicitud = require("../Database/Models/Solicitud");
const Tramite = require("../Database/Models/Tramite");
const Documento = require("../Database/Models/Documento");

//Utilidades
const estatus = {
  1: "Solicitud creada exitosamente, esperando documentos",
  2: "Haz subido tus documentos con exito, espera a que la encargada los revise",
  3: "Ha habido uno o varios errores en tus documentos, por favor revisalos y vuelve a subirlos",
  4: "Los documentos han sido aceptados, favor de venir de manera presencial al departamento de servicios escolares para entregarlos en físico",
  5: "Hemos recibido los documentos en persona, en poco tiempo seran enviados a la aseguradora",
  6: "Se ha armado tu solicitud formal y ya ha sido enviada a la aseguradora",
  7: "La solicitud ha sido rechazada por la aseguradora, revisa los documentos",
  8: "Se han recibido nuevos documentos en formato digital, espera a que se revisen",
  9: "Los nuevos documentos han sido rechazados, por favor sube nuevos documentos",
  10: "La solicitud ha sido reenviada a la aseguradora",
  11: "El finiquito ha sido enviado, necesitas venir en persona a firmarlo",
  12: "Solicitud terminada",
};

//Ruta de la raiz del documento
router.use(express.static(__dirname));

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

//Obtendremos un reporte estadístico basandonos en un periodo de tiempo especificado por la maestra.
router.get("/estadisticos", function (req, res) {
  //Obtenemos todas las solicitudes existentes en el sistema
  Solicitud.findAll({
    attributes: ["fecha_Solicitud", "fecha_Actualizacion", "estatus_Actual"],
    include: [
      {
        model: Usuario,
        attributes: ["matricula", "nombre_Completo"],
      },
      {
        model: Tramite,
        attributes: ["nombre_Tramite"],
      },
    ],
  })
    .then((respuesta) => {
      //Inicializamos el JSON de los registros de solicitudes.
      var excelDatosRegistros = [{}];

      //Inicializamos los conteos estadísticos.
      var conteoTramitesTotales = 0;
      var conteoTramitesIniciados = 0;
      var conteoTramitesFinalizados = 0;
      var excelDatosConteos = [{}];

      //Se recorren todas las solicitudes existentes.
      for (var indice = 0; indice < respuesta.length; indice++) {
        //Se crea un enunciado para una lectura mas facíl por cada solicitud existente.
        var enunciado =
          'El alumno "' +
          respuesta[indice].Usuario.nombre_Completo +
          '" con matricula "' +
          respuesta[indice].Usuario.matricula +
          '" ha solicitado el trámite de "' +
          respuesta[indice].Tramite.nombre_Tramite +
          '".\n Se solicito el dia: ' +
          respuesta[indice].fecha_Solicitud +
          " y al dia de: " +
          respuesta[indice].fecha_Actualizacion +
          ' la solicitud se encuentra en el estatus de "' +
          estatus[respuesta[indice].estatus_Actual] +
          '".';

        //Se añade el registro a la colección para poder enviarlo a la hoja de excel.
        excelDatosRegistros.push({
          Matricula: respuesta[indice].Usuario.matricula,
          "Nombre del Alumno": respuesta[indice].Usuario.nombre_Completo,
          "Tramite solicitado": respuesta[indice].Tramite.nombre_Tramite,
          "Fecha en la que se solicito": respuesta[indice].fecha_Solicitud,
          "Ultimo estatus": estatus[respuesta[indice].estatus_Actual],
          "Ultima fecha de actualizacion":
            respuesta[indice].fecha_Actualizacion,
          Registro: enunciado,
        });

        //Contamos todas las solicitudes que tiene el sistema.
        conteoTramitesTotales++;

        //Obtenemos fechas importantes
        var fechaInicio = new Date(req.query.fechaInicioInforme).getTime();
        var fechaFinal = new Date(req.query.fechaFinalInforme).getTime();
        var fechaSolicitud = new Date(
          respuesta[indice].fecha_Solicitud
        ).getTime();
        var fechaActualizacion = new Date(
          respuesta[indice].fecha_Actualizacion
        ).getTime();

        //Checamos si la solicitud fue iniciada durante el periodo del informe.
        if (fechaSolicitud >= fechaInicio && fechaSolicitud <= fechaFinal) {
          conteoTramitesIniciados++;
        }

        //Checamos si la solicitud fue finalizada en este periodo seleccionado
        if (
          respuesta[indice].estatus_Actual === 12 &&
          fechaActualizacion >= fechaInicio &&
          fechaActualizacion <= fechaFinal
        ) {
          conteoTramitesFinalizados++;
        }
      }

      //Se añaden los conteos a la coleccion.
      excelDatosConteos.push({
        Estadistica: "Solicitudes activas en el sistema",
        Valor: conteoTramitesTotales,
      });
      excelDatosConteos.push({
        Estadistica:
          "Solicitudes iniciadas en el periodo: " +
          req.query.fechaInicioInforme +
          "|" +
          req.query.fechaFinalInforme,
        Valor: conteoTramitesIniciados,
      });
      excelDatosConteos.push({
        Estadistica:
          "Solicitudes finalizadas en el periodo: " +
          req.query.fechaInicioInforme +
          "|" +
          req.query.fechaFinalInforme,
        Valor: conteoTramitesFinalizados,
      });

      //Una vez que recorremos todas las solicitudes, se crea el archivo Excel.
      const excelLibro = XLSX.utils.book_new();

      //Se crea la hoja de excel con los registros obtenidos anteriormente.
      const excelHojaRegistros = XLSX.utils.json_to_sheet(excelDatosRegistros);

      //Se crea la hoja de excel con los conteos de las solicitudes.
      const excelHojaConteos = XLSX.utils.json_to_sheet(excelDatosConteos);

      //Se añade la hoja de excel de registros al archivo excel
      XLSX.utils.book_append_sheet(excelLibro, excelHojaRegistros, "Registros");

      //Se añade la hoja de excel de conteos al archivo excel
      XLSX.utils.book_append_sheet(excelLibro, excelHojaConteos, "Conteos");

      //Se crea el archivo excel en la carpeta Documentos/Otros de la raiz del sistema.
      const excelDirectorio = path.join(__dirname, "..") + "/Documentos/Otros";
      const excelArchivo = excelDirectorio + "/Estadistico.xlsx";
      if (!fs.existsSync(excelDirectorio)) {
        fs.mkdirSync(excelDirectorio, {
          recursive: true,
        });
      }

      if (fs.existsSync(excelArchivo)) {
        fs.unlinkSync(excelArchivo);
      }

      XLSX.writeFile(excelLibro, excelArchivo);
      res.send({
        Codigo: 1,
        Mensaje: "Estadístico terminado.",
      });
    })
    .catch((error) => {
      console.log(error);
      res.send({
        Codigo: 0,
        Mensaje: error,
      });
    });
});

//Crearemos una nueva solicitud.
router.post("/nueva", function (req, res) {
  //Generamos la fecha actual, en formato ISO 8601 YYYY-MM-DD
  var ahora = new Date();
  var fecha_servidor = ahora.toISOString();

  Solicitud.create({
    fecha_Solicitud: fecha_servidor,
    fecha_Actualizacion: fecha_servidor,
    estatus_Actual: 1,
    retroalimentacion_Actual: estatus[1],
    estudiante_Solicitante: req.body.estudianteSolicitante,
    tramite_Solicitado: req.body.tramiteSolicitado,
  })
    .then(() => {
      res.send({ Codigo: 1, Mensaje: "Solicitud creada con exito" });
    })
    .catch((error) => {
      console.log(error);
      res.send({ Codigo: 0, Mensaje: error });
    });
});

router.get("/consulta", function (req, res) {
  Solicitud.findAll({
    include: [
      {
        model: Usuario,
        attributes: ["matricula", "nombre_Completo"],
      },
      { model: Tramite, attributes: ["id_Tramite", "nombre_Tramite"] },
      {
        model: Documento,
        attributes: ["id_Documento", "nombre_Documento", "ruta_Documento"],
      },
    ],
    where: { estudiante_Solicitante: req.query.matricula },
    order: [
      ["fecha_Solicitud", "ASC"],
      ["fecha_Actualizacion", "ASC"],
    ],
  })
    .then((respuesta) => {
      if (respuesta.length > 0) {
        res.send({
          Codigo: respuesta.length > 1 ? 2 : 1,
          Mensaje:
            respuesta.length > 1
              ? "Solicitudes encontradas."
              : "Solicitud encontrada.",
          Dato: respuesta.length > 1 ? respuesta : respuesta[0],
        });
      } else {
        res.send({
          Codigo: 0,
          Mensaje: "No se encontraron solicitudes relacionadas con el usuario.",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.send({ Codigo: 0, Mensaje: error });
    });
});

module.exports = router;
