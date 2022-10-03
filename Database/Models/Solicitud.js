const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Estudiante = require("./Estudiante");
const Tramite = require("./Tramite");
const Usuario = require("./Usuario");

class Solicitud extends Model {}
Solicitud.init(
  {
    id_S: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    fecha_Sol: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_Act: {
      type: DataTypes.DATEONLY,
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

Usuario.hasMany(Solicitud, {
  foreignKey: {
    name: "estudiante",
    allowNull: false,
  },
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Solicitud.belongsTo(Usuario, {
  foreignKey: {
    name: "estudiante",
    allowNull: false,
  },
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Tramite.hasMany(Solicitud, {
  foreignKey: {
    name: "tramite",
    allowNull: false,
  },
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Solicitud.belongsTo(Tramite, {
  foreignKey: {
    name: "tramite",
    allowNull: false,
  },
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

module.exports = Solicitud;
