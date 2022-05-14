import {Sequelize} from "sequelize";

const db = new Sequelize('employeesystem','root','password',{
    host: "localhost",
    dialect: "mysql"
});

export default db;