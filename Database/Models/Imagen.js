const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Tramite_M = require("./Tramite_M");

class Imagen extends Model {}
Imagen.init(
  {
    nombre_I: {
      type: DataTypes.STRING(20),
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
    allowNull: false,
  },
});

Tramite_M.belongsTo(Imagen);

module.exports = Imagen;
