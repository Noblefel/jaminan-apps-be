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

    storage: Boolean(process.env.STORAGE) || false,

    minioURL: process.env.MINIO_URL || "",

    minioPort: Number(process.env.MINIO_PORT) || 9002,

    minioAccess: process.env.MINIO_ACCESS_KEY || "",

    minioSecret: process.env.MINIO_SECRET_KEY || "",

    minioBucket: process.env.MINIO_BUCKET,
}