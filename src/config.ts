export const config = {
    port: process.env.PORT || 3000,
    
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(",") || [],
    
    jwtSecret: process.env.JWT_SECRET || "",

    database: process.env.DATABASE || "mysql",

    databaseName: process.env.DATABASE_NAME || "test-jaminan",

    databaseHost: process.env.DATABASE_HOST || "localhost",

    databasePort: Number(process.env.DATABASE_PORT) || 3306,

    databaseUser: process.env.DATABASE_USER || "root",
    
    databasePassword: process.env.DATABASE_PASSWORD || "",
}