const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Usuario = require("./Usuario");

class Estudiante extends Model {}
Estudiante.init(
  {
    carrera: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    semestre: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Estudiante",
    tableName: "Estudiantes",
    timestamps: false,
  }
);

Usuario.hasOne(Estudiante, {
  foreignKey: {
    name: "matricula_E",
    allowNull: false,
  },
});

module.exports = Estudiante;
