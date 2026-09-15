// lib/document/pdfTools.ts
// Client-side PDF processing utilities

export interface PDFCompressionOptions {
  quality: 'low' | 'medium' | 'high';
  colorSpace: 'grayscale' | 'rgb' | 'cmyk';
}

export interface ImageCompressionOptions {
  quality: number; // 0-100
  maxWidth: number;
  maxHeight: number;
}

export class PDFProcessor {
  // Image to PDF conversion
  static async imagesToPDF(
    images: File[],
    title: string = 'ডকুমেন্ট'
  ): Promise<Blob> {
    const formData = new FormData();
    images.forEach((img, index) => {
      formData.append(`image_${index}`, img);
    });
    formData.append('title', title);

    const response = await fetch('/api/document/images-to-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'PDF তৈরি ব্যর্থ হয়েছে।');
    }

    return await response.blob();
  }

  // PDF compression
  static async compressPDF(
    file: File,
    options: PDFCompressionOptions = { quality: 'medium', colorSpace: 'rgb' }
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('quality', options.quality);
    formData.append('colorSpace', options.colorSpace);

    const response = await fetch('/api/document/compress-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'PDF সংকোচন ব্যর্থ হয়েছে।');
    }

    return await response.blob();
  }

  // Image compression
  static async compressImage(
    file: File,
    options: ImageCompressionOptions = { quality: 80, maxWidth: 1920, maxHeight: 1920 }
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > options.maxWidth) {
              height = Math.round((height * options.maxWidth) / width);
              width = options.maxWidth;
            }
          } else {
            if (height > options.maxHeight) {
              width = Math.round((width * options.maxHeight) / height);
              height = options.maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('ছবি সংকোচন ব্যর্থ।'));
            },
            file.type,
            options.quality / 100
          );
        };
        img.onerror = () => reject(new Error('ছবি লোড ব্যর্থ।'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('ফাইল পড়া ব্যর্থ।'));
      reader.readAsDataURL(file);
    });
  }
}

// File size utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function calculateCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}