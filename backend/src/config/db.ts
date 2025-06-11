import pgPromise from "pg-promise";
import dotenv from "dotenv";
import * as fs from "node:fs";
import path from "node:path";

dotenv.config();
const pgp = pgPromise();

const db = pgp({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const schemaPath = path.join(__dirname, "schema.sql");
const schemaSQL = fs.readFileSync(schemaPath, "utf-8");

db.none(schemaSQL)
    .then(()=>console.log("Database schema has been initialized."))
    .catch((e)=>console.log("Error while initializing the database schema.", e));

export default db;