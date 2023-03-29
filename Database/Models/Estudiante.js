const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");
const Usuario = require("./Usuario");

class Estudiante extends Model {}
Estudiante.init(
  {
    id_Estudiante: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    carrera: {
      type: DataTypes.STRING(40),
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
    name: "matricula_Estudiante",
    allowNull: false,
  },
});

module.exports = Estudiante;
