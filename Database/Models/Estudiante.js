const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Estudiante extends Model {}
Estudiante.init(
    {
    matricula_E: {
        type: DataTypes.STRING(9),
        allowNull: false
    },
    carrera: {
        type: DataTypes.STRING(16),
        allowNull: false
    },
    semestre: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
    },
    { sequelize, modelName: "Estudiante", tableName: "Estudiante", timestamps: false }
);

module.exports = Estudiante;