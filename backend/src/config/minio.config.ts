export const getMinioConfig = () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  accessKey: process.env.MINIO_ACCESS_KEY || 'ast_minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'ast_minio_secret',
  bucket: process.env.MINIO_BUCKET || 'ast-documents',
  useSSL: process.env.MINIO_USE_SSL === 'true',
});
