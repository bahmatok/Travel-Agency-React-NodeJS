// XMLHttpRequest для загрузки файлов с отслеживанием прогресса
export const uploadFileWithProgress = (file, onProgress, onComplete, onError) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        if (onProgress) {
          onProgress(percentComplete);
        }
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (onComplete) {
          onComplete(response);
        }
        resolve(response);
      } else {
        const error = new Error(`Upload failed: ${xhr.statusText}`);
        if (onError) {
          onError(error);
        }
        reject(error);
      }
    });

    xhr.addEventListener('error', () => {
      const error = new Error('Upload failed');
      if (onError) {
        onError(error);
      }
      reject(error);
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
};

