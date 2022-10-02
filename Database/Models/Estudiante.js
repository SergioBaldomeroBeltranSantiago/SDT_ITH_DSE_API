const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Usuario = require("./Usuario");

class Estudiante extends Model {}
Estudiante.init(
  {
    matricula_E: {
      type: DataTypes.STRING(9),
      allowNull: false,
      references: {
        model: Usuario,
        key: matricula,
      },
    },
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

module.exports = Estudiante;
