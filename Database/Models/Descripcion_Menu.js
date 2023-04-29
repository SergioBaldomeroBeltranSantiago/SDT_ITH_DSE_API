const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Descripcion_Menu extends Model {}
Descripcion_Menu.init(
  {
    id_texto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    barraEstatus:{
      type: DataTypes.INTEGER,
      allowNull: true
    },
    retroalimentaciones: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Descripcion_Menu", tableName: "Descripcion_Menus", timestamps: false }
);

module.exports = Descripcion_Menu;
