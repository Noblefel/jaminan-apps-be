import { DataSource, type DatabaseType } from "typeorm";
import { config } from "./config.ts";
import { User } from "./types/user.ts";

export const Connection = new DataSource({
    type: config.database as any, // typescript membagongkan
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    synchronize: true,
    logging: true,
    entities: [User]
});