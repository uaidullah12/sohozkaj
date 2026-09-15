// lib/crop/imageCropper.ts
// Advanced manual crop adjustment system with real-time validation

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropSettings {
  aspectRatio: number | null; // null = free crop
  locked: boolean;
  dpi: number;
  unit: 'mm' | 'cm' | 'inch' | 'px';
}

export interface CropPreset {
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'inch';
  dpi: number;
  aspectRatio: number;
  category: string;
}

export class ImageCropper {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement;
  private crop: CropArea;
  private settings: CropSettings;
  private imageWidth: number;
  private imageHeight: number;

  constructor(
    canvasId: string,
    imageSource: string,
    initialSettings: Partial<CropSettings> = {}
  ) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error('ক্যানভাস এলিমেন্ট পাওয়া যায়নি।');

    this.ctx = this.canvas.getContext('2d')!;
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';

    this.settings = {
      aspectRatio: 1,
      locked: true,
      dpi: 300,
      unit: 'mm',
      ...initialSettings,
    };

    this.imageWidth = 0;
    this.imageHeight = 0;
    this.crop = { x: 0, y: 0, width: 0, height: 0 };

    this.loadImage(imageSource);
  }

  private loadImage(src: string): void {
    this.image.onload = () => {
      this.imageWidth = this.image.naturalWidth;
      this.imageHeight = this.image.naturalHeight;

      // Center crop by default
      const size = Math.min(this.imageWidth, this.imageHeight);
      this.crop = {
        x: (this.imageWidth - size) / 2,
        y: (this.imageHeight - size) / 2,
        width: size,
        height: size,
      };

      this.draw();
    };

    this.image.onerror = () => {
      throw new Error('ছবি লোড করা যায়নি।');
    };

    this.image.src = src;
  }

  private validateCrop(): void {
    // Boundary checking
    if (this.crop.x < 0) this.crop.x = 0;
    if (this.crop.y < 0) this.crop.y = 0;
    if (this.crop.x + this.crop.width > this.imageWidth) {
      this.crop.width = this.imageWidth - this.crop.x;
    }
    if (this.crop.y + this.crop.height > this.imageHeight) {
      this.crop.height = this.imageHeight - this.crop.y;
    }

    // Aspect ratio constraint
    if (this.settings.locked && this.settings.aspectRatio) {
      const ratio = this.settings.aspectRatio;
      const currentRatio = this.crop.width / this.crop.height;

      if (Math.abs(currentRatio - ratio) > 0.01) {
        if (currentRatio > ratio) {
          this.crop.width = this.crop.height * ratio;
        } else {
          this.crop.height = this.crop.width / ratio;
        }
      }
    }
  }

  public draw(): void {
    this.validateCrop();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw image
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

    // Draw darkened areas outside crop
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear crop area
    this.ctx.clearRect(
      this.crop.x,
      this.crop.y,
      this.crop.width,
      this.crop.height
    );

    // Draw crop border
    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.crop.x, this.crop.y, this.crop.width, this.crop.height);

    // Draw corner handles
    this.drawHandles();
  }

  private drawHandles(): void {
    const handleSize = 8;
    const corners = [
      { x: this.crop.x, y: this.crop.y },
      { x: this.crop.x + this.crop.width, y: this.crop.y },
      { x: this.crop.x, y: this.crop.y + this.crop.height },
      { x: this.crop.x + this.crop.width, y: this.crop.y + this.crop.height },
    ];

    this.ctx.fillStyle = '#4CAF50';
    corners.forEach(corner => {
      this.ctx.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }

  public moveCrop(dx: number, dy: number): void {
    this.crop.x += dx;
    this.crop.y += dy;
    this.validateCrop();
    this.draw();
  }

  public resizeCrop(dw: number, dh: number, lockAspect: boolean = this.settings.locked): void {
    this.crop.width += dw;
    this.crop.height += dh;

    if (lockAspect && this.settings.aspectRatio) {
      const ratio = this.settings.aspectRatio;
      this.crop.height = this.crop.width / ratio;
    }

    this.validateCrop();
    this.draw();
  }

  public setCropPreset(preset: CropPreset): void {
    // Convert preset dimensions to pixels based on DPI
    const dpiRatio = this.settings.dpi / 96; // 96 DPI is standard screen DPI
    let widthPx = 0;
    let heightPx = 0;

    switch (preset.unit) {
      case 'mm':
        widthPx = (preset.width / 25.4) * this.settings.dpi;
        heightPx = (preset.height / 25.4) * this.settings.dpi;
        break;
      case 'cm':
        widthPx = (preset.width / 2.54) * this.settings.dpi;
        heightPx = (preset.height / 2.54) * this.settings.dpi;
        break;
      case 'inch':
        widthPx = preset.width * this.settings.dpi;
        heightPx = preset.height * this.settings.dpi;
        break;
    }

    // Center the crop
    this.crop = {
      x: (this.imageWidth - widthPx) / 2,
      y: (this.imageHeight - heightPx) / 2,
      width: widthPx,
      height: heightPx,
    };

    this.settings.aspectRatio = preset.aspectRatio;
    this.validateCrop();
    this.draw();
  }

  public toggleAspectRatioLock(): void {
    this.settings.locked = !this.settings.locked;
  }

  public setAspectRatio(ratio: number | null): void {
    this.settings.aspectRatio = ratio;
    if (ratio) {
      this.crop.height = this.crop.width / ratio;
      this.validateCrop();
      this.draw();
    }
  }

  public setDPI(dpi: number): void {
    this.settings.dpi = dpi;
  }

  public resetCrop(): void {
    const size = Math.min(this.imageWidth, this.imageHeight);
    this.crop = {
      x: (this.imageWidth - size) / 2,
      y: (this.imageHeight - size) / 2,
      width: size,
      height: size,
    };
    this.validateCrop();
    this.draw();
  }

  public getCropInfo(): {
    pixels: { width: number; height: number };
    physical: { width: number; height: number; unit: string };
    output: { width: number; height: number };
  } {
    const physicalWidth = (this.crop.width / this.settings.dpi) * 25.4; // to mm
    const physicalHeight = (this.crop.height / this.settings.dpi) * 25.4;

    const outputWidth = Math.round(this.crop.width);
    const outputHeight = Math.round(this.crop.height);

    return {
      pixels: {
        width: Math.round(this.crop.width),
        height: Math.round(this.crop.height),
      },
      physical: {
        width: Math.round(physicalWidth * 100) / 100,
        height: Math.round(physicalHeight * 100) / 100,
        unit: 'mm',
      },
      output: { width: outputWidth, height: outputHeight },
    };
  }

  public async getCroppedImage(): Promise<Blob> {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.crop.width;
    tempCanvas.height = this.crop.height;

    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(
      this.image,
      this.crop.x,
      this.crop.y,
      this.crop.width,
      this.crop.height,
      0,
      0,
      this.crop.width,
      this.crop.height
    );

    return new Promise(resolve => {
      tempCanvas.toBlob(blob => {
        resolve(blob!);
      }, 'image/png');
    });
  }
}

// Photo presets for different document types
export const PHOTO_PRESETS: Record<string, CropPreset[]> = {
  passport: [
    {
      name: 'US Passport (2×2 in)',
      width: 2,
      height: 2,
      unit: 'inch',
      dpi: 300,
      aspectRatio: 1,
      category: 'Passport',
    },
  ],
  visa: [
    {
      name: 'UK Visa (35×45 mm)',
      width: 35,
      height: 45,
      unit: 'mm',
      dpi: 300,
      aspectRatio: 35 / 45,
      category: 'Visa',
    },
  ],
  nid: [
    {
      name: 'Bangladesh NID (35×45 mm)',
      width: 35,
      height: 45,
      unit: 'mm',
      dpi: 300,
      aspectRatio: 35 / 45,
      category: 'NID',
    },
  ],
};
