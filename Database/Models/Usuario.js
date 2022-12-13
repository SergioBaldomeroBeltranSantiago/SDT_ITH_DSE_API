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
    nombre_Completo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contraseña: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    correo_e: { type: DataTypes.STRING },
  },
  { sequelize, modelName: "Usuario", tableName: "Usuarios", timestamps: false }
);

module.exports = Usuario;
