declare namespace NodeJS {
  export interface ProcessEnv {
    DEMO_SIGNING_PRIVATE_KEY: string;
    DEMO_ENCRYPTION_SECRET: string;
    REDIS_URL: string;
    MAVENAGI_APP_ID: string;
    MAVENAGI_APP_SECRET: string;
  }
}
