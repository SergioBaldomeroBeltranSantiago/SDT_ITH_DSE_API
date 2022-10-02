const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Estudiante = require("./Estudiante");
const Tramite = require("./Tramite");

class Solicitud extends Model {}
Solicitud.init(
  {
    id_S: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    estudiante: {
      type: DataTypes.STRING(9),
      allowNull: false,
      references: {
        model: Estudiante,
        key: matricula_E,
      },
    },
    tramite: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: Tramite,
        key: id_T,
      },
    },
    fecha_Sol: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_Act: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    retroalimentacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Solicitud",
    tableName: "Solicitudes",
    timestamps: false,
  }
);

module.exports = Solicitud;
