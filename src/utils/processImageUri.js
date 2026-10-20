import {Platform} from 'react-native';

const EXTENSION_MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

// Only guesses from the filename when the picker didn't already report a real
// MIME type — guessing `image/${ext}` for every extension mislabeled PDF/Word
// uploads (e.g. "image/pdf"), which the backend's declared-Content-Type check
// then silently rejected.
const resolveMimeType = (declaredType, filename) => {
  if (declaredType) return declaredType;
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase();
  return (ext && EXTENSION_MIME_MAP[ext]) || 'application/octet-stream';
};

export const processImageUri = (image, type, multiple) => {
  if (multiple) {
    return image.map(imageItem => {
      const uri =
        Platform.OS === 'android'
          ? imageItem.fileCopyUri
          : imageItem.fileCopyUri.replace('file://', '');
      const filename = imageItem.fileCopyUri.split('/').pop();
      const name = imageItem.name || filename;
      const mimeType = resolveMimeType(imageItem.type, name);
      return {uri, name, type: mimeType};
    });
  } else if (type === 'file') {
    const uri =
      Platform.OS === 'android'
        ? image[0].fileCopyUri
        : image[0].fileCopyUri.replace('file://', '');
    const filename = image[0].fileCopyUri.split('/').pop();
    const name = image[0].name || filename;
    const mimeType = resolveMimeType(image[0].type, name);
    return {uri, name, type: mimeType};
  } else {
    const uri =
      Platform.OS === 'android'
        ? image[0].uri
        : image[0].uri.replace('file://', '');
    const filename = image[0].uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename)?.[1];
    const ext = match?.[1];
    const type = match ? `image/${match[1]}` : `image`;
    return {uri, name: `image.${ext}`, type};
  }
};
