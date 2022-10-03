const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Solicitud = require("./Solicitud");

class Documento extends Model {}
Documento.init(
  {
    nombre_D: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    documento_Data: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Documento",
    tableName: "Documentos",
    timestamps: false,
  }
);

Solicitud.hasMany(Documento, {
  foreignKey: {
    name: "Solicitud",
    allowNull: false,
  },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Documento.removeAttribute("id");

module.exports = Documento;
