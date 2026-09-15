// lib/validation/fileValidator.ts
// Server-side validation of uploads - ensure no malicious files

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  minDimension?: number;
  maxDimension?: number;
}

export const DEFAULT_IMAGE_VALIDATION: FileValidationOptions = {
  maxSizeBytes: 60 * 1024 * 1024, // 60MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  minDimension: 100,
  maxDimension: 8000,
};

export const DEFAULT_PDF_VALIDATION: FileValidationOptions = {
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: ['application/pdf'],
  allowedExtensions: ['pdf'],
};

export class FileValidator {
  static validateFile(
    file: File,
    options: FileValidationOptions
  ): ValidationResult {
    // Check size
    if (file.size > options.maxSizeBytes) {
      return {
        valid: false,
        error: `ফাইল আকার ${options.maxSizeBytes / (1024 * 1024)}MB এর বেশি হতে পারে না।`,
      };
    }

    // Check MIME type (don't trust browser alone)
    if (!options.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `ফাইল ধরন ${file.type} সমর্থিত নয়।`,
      };
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!options.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `ফাইল এক্সটেনশন .${ext} সমর্থিত নয়।`,
      };
    }

    // Prevent path traversal
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return {
        valid: false,
        error: 'অবৈধ ফাইল নাম।',
      };
    }

    return { valid: true };
  }

  static async validateImageDimensions(
    file: File,
    options: FileValidationOptions
  ): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const { minDimension = 0, maxDimension = 8000 } = options;
          if (img.width < minDimension || img.height < minDimension) {
            resolve({
              valid: false,
              error: `ছবির ন্যূনতম মাপ ${minDimension}×${minDimension} পিক্সেল হতে হবে।`,
            });
          } else if (img.width > maxDimension || img.height > maxDimension) {
            resolve({
              valid: false,
              error: `ছবির সর্বোচ্চ মাপ ${maxDimension}×${maxDimension} পিক্সেল হতে পারে।`,
            });
          } else {
            resolve({ valid: true });
          }
        };
        img.onerror = () => {
          resolve({
            valid: false,
            error: 'ছবি বৈধ নয় বা দুর্নীতিগ্রস্ত।',
          });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({
          valid: false,
          error: 'ফাইল পড়া ব্যর্থ।',
        });
      };
      reader.readAsDataURL(file);
    });
  }
}