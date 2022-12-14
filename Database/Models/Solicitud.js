const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Estudiante = require("./Estudiante");
const Tramite = require("./Tramite");
const Usuario = require("./Usuario");

class Solicitud extends Model {}
Solicitud.init(
  {
    id_Solicitud: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    fecha_Solicitud: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_Actualizacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estatus_Actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    retroalimentacion_Actual: {
      type: DataTypes.TEXT,
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

Usuario.hasMany(Solicitud, {
  foreignKey: {
    name: "estudiante_Solicitante",
    allowNull: false,
  },
});

Solicitud.belongsTo(Usuario, {
  foreignKey: {
    name: "estudiante_Solicitante",
    allowNull: false,
  },
});

Tramite.hasMany(Solicitud, {
  foreignKey: {
    name: "tramite_Solicitado",
    allowNull: false,
  },
});

Solicitud.belongsTo(Tramite, {
  foreignKey: {
    name: "tramite_Solicitado",
    allowNull: false,
  },
});

module.exports = Solicitud;
