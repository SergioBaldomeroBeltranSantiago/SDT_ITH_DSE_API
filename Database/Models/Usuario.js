const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Usuario extends Model {}
Usuario.init(
  {
    matricula: {
      type: DataTypes.STRING(9),
      allowNull: false,
      primaryKey: true,
    },
    nombre_C: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    contraseña: {
      type: DataTypes.STRING(12),
      allowNull: false,
    },
    correo_e: DataTypes.STRING(30),
  },
  { sequelize, modelName: "Usuario", tableName: "Usuarios", timestamps: false }
);

module.exports = Usuario;
