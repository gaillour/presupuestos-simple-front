export type CropAspectRatio = 'original' | '1:1' | '4:5'

export interface ProcessedPhoto {
  id: string
  filename: string
  base64: string
  previewUrl: string
  width: number
  height: number
  sizeKB: number
  aspect: CropAspectRatio
  enhanced: boolean
}

export interface ProcessPhotoOptions {
  maxDimension?: number
  quality?: number
  aspect?: CropAspectRatio
  enhance?: boolean
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`No se pudo cargar la imagen ${file.name}.`))
    }
    img.src = url
  })
}

export async function processImageFile(
  file: File,
  options: ProcessPhotoOptions = {}
): Promise<ProcessedPhoto> {
  const {
    maxDimension = 1600,
    quality = 0.86,
    aspect = 'original',
    enhance = false,
  } = options

  const img = await loadImageFromFile(file)
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height

  // Calcular recorte centrado según aspect ratio elegido
  let cropX = 0
  let cropY = 0
  let cropW = srcW
  let cropH = srcH

  if (aspect === '1:1') {
    const side = Math.min(srcW, srcH)
    cropW = side
    cropH = side
    cropX = Math.floor((srcW - side) / 2)
    cropY = Math.floor((srcH - side) / 2)
  } else if (aspect === '4:5') {
    const targetRatio = 4 / 5
    const currentRatio = srcW / srcH
    if (currentRatio > targetRatio) {
      cropH = srcH
      cropW = Math.round(srcH * targetRatio)
      cropX = Math.floor((srcW - cropW) / 2)
    } else {
      cropW = srcW
      cropH = Math.round(srcW / targetRatio)
      cropY = Math.floor((srcH - cropH) / 2)
    }
  }

  const scale = Math.min(1, maxDimension / Math.max(cropW, cropH))
  const outW = Math.max(1, Math.round(cropW * scale))
  const outH = Math.max(1, Math.round(cropH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No se pudo inicializar el procesador de imágenes.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outW, outH)
  if (enhance) {
    ctx.filter = 'brightness(1.06) contrast(1.08) saturate(1.06)'
  }
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH)

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base64 = dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : dataUrl
  const sizeKB = Math.round((base64.length * 3) / 4 / 1024)
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto'

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    filename: `${baseName}.jpg`,
    base64,
    previewUrl: dataUrl,
    width: outW,
    height: outH,
    sizeKB,
    aspect,
    enhanced: enhance,
  }
}
