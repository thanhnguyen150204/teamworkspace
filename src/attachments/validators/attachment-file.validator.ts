import { FileValidator } from '@nestjs/common';
export interface AttachmentFileValidatorOptions {
  allowedMimeTypes?: string[];
}
const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpg',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class AttachmentFileValidator extends FileValidator<AttachmentFileValidatorOptions> {
  constructor(options: AttachmentFileValidatorOptions = {}) {
    super({
      allowedMimeTypes: options.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES,
    });
  }
  isValid(file?: Express.Multer.File): boolean {
    if (!file || !file.buffer) {
      return false;
    }
    if (!this.validationOptions.allowedMimeTypes?.includes(file.mimetype)) {
      return false;
    }
    return this.validateMagicBytes(file.buffer, file.mimetype);
  }
  buildErrorMessage(file: Express.Multer.File): string {
    if (!file) {
      return 'File is required';
    }
    if (!this.validationOptions.allowedMimeTypes?.includes(file.mimetype)) {
      return `File type '${file.mimetype}' is not allowed. Allowed types: ${this.validationOptions.allowedMimeTypes?.join(', ')}`;
    }
    return `File content signature (magic bytes) does not match declared type '${file.mimetype}'`;
  }
  private validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
    if (buffer.length < 4) return false;
    if (mimetype === 'image/png') {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    }
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimetype === 'application/pdf') {
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    }
    if (mimetype === 'image/webp') {
      if (buffer.length < 12) return false;
      const isRiff =
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46;
      const isWebp =
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50;
      return isRiff && isWebp;
    }
    if (
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      );
    }
    if (mimetype === 'text/plain') {
      const checkLength = Math.min(buffer.length, 512);
      for (let i = 0; i < checkLength; i++) {
        if (buffer[i] === 0) return false;
      }
      return true;
    }
    return true;
  }
}
