import { DataSource, type DatabaseType } from "typeorm";
import { config } from "./config.ts";
import { User } from "./types/user.ts";
import { ClientManual } from "./types/client.ts";
import { Jaminan } from "./types/jaminan.ts";

export const Connection = new DataSource({
    type: config.database as any, // typescript membagongkan
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    synchronize: true,
    logging: true,
    entities: [User, ClientManual, Jaminan],
    timezone: "Z",
});