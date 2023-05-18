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
//Base de datos
const { Op } = require("sequelize");

//Modelos
const Usuario = require("../Database/Models/Usuario");
const Solicitud = require("../Database/Models/Solicitud");
const Tramite = require("../Database/Models/Tramite");

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
router.use(express.json({ limit: "10mb" }));
router.use(express.urlencoded({ extended: true, limit: "10mb" }));

//Obtendremos un reporte estadístico basandonos en un periodo de tiempo especificado por la maestra.
router.get("/estadisticosolicitudes", function (req, res) {
  //Obtenemos todas las solicitudes existentes en el sistema
  Solicitud.findAll({
    attributes: ["fecha_Solicitud", "fecha_Actualizacion", "estatus_Actual"],
    include: [
      {
        model: Usuario,
        attributes: ["matricula", "nombre_Completo"],
      },
      { model: Tramite, attributes: ["nombre_Tramite"] },
    ],
    where: {
      [Op.or]: [
        {
          fecha_Solicitud: {
            [Op.between]: [
              req.query.fechaInicioInforme,
              req.query.fechaFinalInforme,
            ],
          },
        },
        {
          fecha_Actualizacion: {
            [Op.between]: [
              req.query.fechaInicioInforme,
              req.query.fechaFinalInforme,
            ],
          },
        },
      ],
    },
  })
    .then((respuesta) => {
      //Abrimos el archivo excel
      const excelLibro = XLSX.readFile(
        path.join(__dirname, "..") + "/Documentos/Otros/Plantilla_Estadisticas.xlsx"
      );
      //Abrimos una hoja de excel
      const excelHoja = excelLibro.Sheets["Hoja_1"];

      var enunciado =
        'El alumno "' +
        respuesta[0].Usuario.nombre_Completo +
        '" con matricula "' +
        respuesta[0].Usuario.matricula +
        '" ha solicitado el trámite de "' +
        respuesta[0].Tramite.nombre_Tramite +
        '" en la fecha: ' +
        respuesta[0].fecha_Solicitud +
        " .A la fecha: " +
        respuesta[0].fecha_Actualizacion +
        ' la solicitud se encuentra en el estatus de "' +
        estatus[respuesta[0].estatus_Actual] +
        '".';

      var referenciaCelda = XLSX.utils.encode_cell({ r: 1, c: 1 });
      excelHoja[referenciaCelda] = { v: enunciado };
      referenciaCelda = XLSX.utils.encode_cell({ r: 2, c: 1 });
      excelHoja[referenciaCelda] = {
        v: "Solicitudes totales: " + respuesta.length,
      };

      /*
      excelHoja["A1"] = { v: enunciado };
      excelHoja["A2"] = { v: "Solicitudes totales: " + respuesta.length };
      */

      XLSX.writeFile(
        excelLibro,
        path.join(__dirname, "..") + "/Documentos/Otros/Estadisticas.xlsx"
      );
      res.send("a");
    })
    .catch((error) => {
      console.log(error);
      res.send({ Codigo: 0, Mensaje: error });
    });
});

module.exports = router;
