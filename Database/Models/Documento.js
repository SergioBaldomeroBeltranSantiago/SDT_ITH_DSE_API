const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Documento extends Model {}
Documento.init(
  {
    solicitud: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: Solicitud,
        key: id_S,
      },
    },
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

module.exports = Documento;
