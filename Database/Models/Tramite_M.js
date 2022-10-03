const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Imagen = require("./Imagen");
const Tramite = require("./Tramite");

class Tramite_M extends Model {}
Tramite_M.init(
  {
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

Tramite.hasMany(Tramite_M, {
  foreignKey: {
    name: "id_TM",
    allowNull: false,
  },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Imagen.hasMany(Tramite_M, {
  foreignKey: {
    name: "imagen",
    allowNull: false,
  },
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Tramite_M.removeAttribute("id");

module.exports = Tramite_M;
