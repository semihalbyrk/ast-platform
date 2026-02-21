import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client | null = null;
  private bucket: string;
  private useLocal = false;
  private localDir: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket =
      this.configService.get<string>('MINIO_BUCKET') || 'ast-documents';
    this.localDir = path.join(process.cwd(), 'storage');
  }

  async onModuleInit() {
    try {
      const endpoint =
        this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
      const port = parseInt(
        this.configService.get<string>('MINIO_PORT') || '9000',
        10,
      );

      this.client = new Minio.Client({
        endPoint: endpoint,
        port,
        accessKey:
          this.configService.get<string>('MINIO_ACCESS_KEY') || 'ast_minio',
        secretKey:
          this.configService.get<string>('MINIO_SECRET_KEY') ||
          'ast_minio_secret',
        useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      });

      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
      }
      this.logger.log(`MinIO connected, bucket: ${this.bucket}`);
    } catch {
      this.logger.warn(
        'MinIO not available, falling back to local filesystem storage',
      );
      this.useLocal = true;
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
    }
  }

  async uploadBuffer(
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (this.useLocal || !this.client) {
      const filePath = path.join(this.localDir, objectName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
      return `/storage/${objectName}`;
    }

    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    return `/${this.bucket}/${objectName}`;
  }

  async getBuffer(objectName: string): Promise<Buffer> {
    if (this.useLocal || !this.client) {
      const filePath = path.join(this.localDir, objectName);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${objectName}`);
      }
      return fs.readFileSync(filePath);
    }

    const stream = await this.client.getObject(this.bucket, objectName);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
