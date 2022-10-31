const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
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
    name: "tramite",
    allowNull: false,
  },
});

module.exports = Tramite_M;
