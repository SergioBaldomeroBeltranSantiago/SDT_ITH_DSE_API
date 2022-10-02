const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Imagen = require("./Imagen");
const Tramite = require("./Tramite");

class Tramite_M extends Model {}
Tramite_M.init(
  {
    id_TM: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: Tramite,
        key: id_T,
      },
    },
    imagen: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: Imagen,
        key: id_I,
      },
    },
    texto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Tramite_M",
    tableName: "Tramites_M",
    timestamps: false,
  }
);

module.exports = Tramite_M;
