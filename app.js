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

//Directorio
app.use(express.static(__dirname));

//Almacenamiento de archivos
var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    //Vamos a determinar si los archivos van a la carpeta de solicitudes o correos
    var carpeta = req.body.isSolicitud ? "Solicitudes" : "Correos";
    //Aquí determinamos si la subcarpeta es la matricula del estudiante o la ID de la plantilla del correo.
    var subCarpeta = req.body.subCarpeta;
    //Checamos que el directorio dinamico exista, si no existe, se crea
    var directorio = __dirname + "/Documentos/" + carpeta + "/" + subCarpeta;
    if (!fs.existsSync(directorio)) {
      fs.mkdirSync(directorio, { recursive: true });
    }
    callBack(null, directorio);
  },
  filename: (req, file, callBack) => {
    var ahora = new Date();
    //Generamos la fecha actual, en formato ISO 8601 YYYY-MM-DD-HH-MM-SS
    var fecha_actual =
      ahora.getUTCFullYear() +
      "-" +
      (ahora.getUTCMonth() + 1) +
      "-" +
      ahora.getUTCDate() +
      "-" +
      ahora.getUTCHours() +
      "-" +
      ahora.getUTCMinutes() +
      "-" +
      ahora.getUTCSeconds();
    //Archivo cuyo nombre empieza con la fecha, se le añade un número aleatorio del 0 al 999, y al final, el nombre original del archivo, todo separado por _
    var nombre_archivo =
      fecha_actual +
      "_" +
      Math.floor(Math.random() * 1000) +
      "_" +
      file.originalname;
    callBack(null, nombre_archivo);
  },
});

const upload = multer({ storage }).any();

//Prueba
app.get("/", function (req, res) {
  res.send("Patata");
});

//Obtener archivos de los JSON existentes
app.get("/ObtenerDocumentoJSON", function (req, res) {
  console.log(req.query);
  console.log(req.body);
  const ruta = __dirname + "/Documentos/Solicitudes/" + req.query.subCarpeta;
  const archivo_buscar = req.query.nombreArchivo;

  fs.readdir(ruta, (error, archivos) => {
    if (error) {
      console.log(error);
      res.send({ Code: -1 });
      return;
    }

    archivos.forEach((archivo) => {
      if (archivo.split("_")[2] === archivo_buscar) {
        const archivo_descarga = ruta + "/" + archivo;

        fs.access(archivo_descarga, fs.constants.F_OK, (error) => {
          if (error) {
            console.log(error);
            res.send({ Code: -1 });
            return;
          }

          res.download(archivo_descarga, (error) => {
            if (error) {
              console.log(error);
              res.send({ Code: -1 });
              return;
            }
          });
        });
      }
    });
  });
});

//Enviar lista de JSON existentes
app.get("/ObtenerListaJSON", function (req, res) {
  fs.readdir("JSON", (error, archivos) => {
    if (error) {
      console.log(error);
      res.send({ Code: 0 });
    }

    const TitulosJSON = [];

    archivos.forEach((archivo) => {
      const Info = fs.readFileSync(path.join("JSON", archivo));
      const JInfo = JSON.parse(Info);
      TitulosJSON.push(JInfo);
    });

    if (TitulosJSON.length > 0) {
      res.send(TitulosJSON);
    } else {
      res.send({ Code: 0 });
    }
  });
});

//Modificar JSON existente
//Se va a eliminar
app.post("/ModificarCorreo", function (req, res) {
  console.log(req.body);

  fs.readFile(
    "JSON/" + req.body.nombreArchivo,
    "utf8",
    (error, informacion) => {
      if (error) {
        console.log(error);
        res.send({ Code: 0 });
      }

      const Json = JSON.parse(informacion);
      Json.cuerpo = req.body.Cuerpo;
      Json.destinatario = req.body.Destinatario;
      Json.asunto = req.body.Asunto;
      Json.adjuntos = req.body.Adjuntos;

      fs.writeFile(
        "JSON/" + req.body.nombreArchivo,
        JSON.stringify(Json),
        (error) => {
          if (error) {
            console.log(error);
            res.send({ Code: 0 });
          }
          res.send({ Code: 1 });
        }
      );
    }
  );
});

app.post("/ModificarJSON", upload, function (req, res) {
  var ahora = new Date();
  //Generamos la fecha actual, en formato ISO 8601 YYYY-MM-DD-HH-MM-SS
  var fecha_actual =
    ahora.getUTCFullYear() +
    "-" +
    (ahora.getUTCMonth() + 1) +
    "-" +
    ahora.getUTCDate() +
    "-" +
    ahora.getUTCHours() +
    "-" +
    ahora.getUTCMinutes() +
    "-" +
    ahora.getUTCSeconds();

  fecha_actual = fecha_actual.trim();
  var listaArchivosAdjuntos = "";
  //Checamos la carpeta en busca de archivos viejos, para eliminarlos
  var carpeta = __dirname + "/Documentos/Solicitudes/" + req.body.subCarpeta;
  if (fs.existsSync(carpeta)) {
    fs.readdirSync(carpeta).forEach((archivo) => {
      var fecha_archivo = archivo.split("_")[0].trim();
      if (fecha_actual !== fecha_archivo) {
        fs.unlinkSync(carpeta + "/" + archivo);
      } else {
        listaArchivosAdjuntos += archivo.split("_")[2].trim() + ";";
      }
    });
  }

  listaArchivosAdjuntos = listaArchivosAdjuntos.slice(0, -1);

  //Ahora que ya eliminamos los archivos viejos, solamente sobreescribimos los valores del JSON con los nuevos valores
  const jsonModificar = JSON.parse(req.body.data).titulo;
  //console.log(JSON.parse(req.body.data));
  fs.readdir(__dirname + "/JSON", (error, archivos) => {
    if (error) {
      console.log(error);
      res.send({ Code: -1 });
    }

    archivos.forEach((archivo) => {
      fs.readFile(
        __dirname + "/JSON/" + archivo,
        "utf8",
        (error, informacion) => {
          if (error) {
            console.log(error);
            res.send({ Code: -1 });
          }

          const jsonInfo = JSON.parse(informacion);

          //console.log(jsonInfo.titulo);
          //console.log(jsonModificar);
          //console.log(JSON.parse(req.body.data).cuerpo)

          if (jsonInfo.titulo === jsonModificar) {
            jsonInfo.asunto = JSON.parse(req.body.data).asunto;
            jsonInfo.destinatario = JSON.parse(req.body.data).destinatario;
            jsonInfo.cuerpo = JSON.parse(req.body.data).cuerpo;
            jsonInfo.adjuntos = listaArchivosAdjuntos;

            fs.writeFile(
              __dirname + "/JSON/" + archivo,
              JSON.stringify(jsonInfo),
              (error) => {
                if (error) {
                  console.log(error);
                  res.send({ Code: -1 });
                }
                res.send({ Code: 1 });
              }
            );
          }
        }
      );
    });
  });
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
