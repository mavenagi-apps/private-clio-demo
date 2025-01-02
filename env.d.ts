declare namespace NodeJS {
  interface ProcessEnv {
    MAVENAGI_APP_ID: string;
    MAVENAGI_APP_SECRET: string;
    DEMO_ENCRYPTION_SECRET: string;
    DEMO_SIGNING_PRIVATE_KEY: string;
    REDIS_URL: string;
  }
}
