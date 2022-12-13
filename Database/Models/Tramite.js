const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Tramite extends Model {}
Tramite.init(
  {
    id_Tramite: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
    },
    nombre_Tramite: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Tramite", tableName: "Tramites", timestamps: false }
);

module.exports = Tramite;
