const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Tramite_M = require("./Tramite_M");

class Imagen extends Model {}
Imagen.init(
  {
    id_Imagen: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nombre_Imagen: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    archivo_Imagen: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Imagen", tableName: "Imagenes", timestamps: false }
);

Imagen.hasMany(Tramite_M, {
  foreignKey: {
    name: "imagen_Asociada",
    allowNull: true,
  },
});

module.exports = Imagen;
