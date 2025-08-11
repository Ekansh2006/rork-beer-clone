export const CLOUDINARY_CONFIG = {
  cloudName: 'df4tx4erp',
  uploadPreset: 'beer-app-photos',
  apiKey: '736319717389867'
};

export const uploadImageToCloudinary = async (imageUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg'
  } as any);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const data = await response.json();
    return data.secure_url;
  } catch {
    throw new Error('Image upload failed');
  }
};