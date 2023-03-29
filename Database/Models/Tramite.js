const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Tramite extends Model {}
Tramite.init(
  {
    id_Tramite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_Tramite: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Tramite", tableName: "Tramites", timestamps: false }
);

module.exports = Tramite;
