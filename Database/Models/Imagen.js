const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Tramite_M = require("./Tramite_M");

class Imagen extends Model {}
Imagen.init(
  {
    nombre_I: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Imagen_Data: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Imagen", tableName: "Imagenes", timestamps: false }
);

Imagen.hasMany(Tramite_M, {
  foreignKey: {
    name: "imagen",
    allowNull: true,
  },
});

module.exports = Imagen;
