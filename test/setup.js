// Configure test environment variables before any server code is imported
process.env.NODE_ENV = 'test';
process.env.STORAGE_MODE = 'local';
process.env.TRUST_PROXY = 'false';
delete process.env.FIREBASE_PROJECT_ID;
delete process.env.FIREBASE_CLIENT_EMAIL;
delete process.env.FIREBASE_PRIVATE_KEY;
delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
