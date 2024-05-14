// noinspection JSUnusedGlobalSymbols
import {ref, uploadBytesResumable} from 'firebase/storage';
import * as React from 'react';
import {useState} from 'react';
import {useStorage, useStorageDownloadURL, useStorageTask} from 'reactfire';
import {CardSection} from './misc/Card';
import {LoadingSpinner} from './misc/Loading';
import {AuthWrapper} from './Authentication';

import type {UploadTaskSnapshot, UploadTask, StorageReference} from 'firebase/storage';


const UploadProgress = ({
  uploadTask,
  storageRef
}: React.PropsWithoutRef<{ uploadTask: UploadTask, storageRef: StorageReference }>) => {
  const {status, data: uploadProgress} = useStorageTask<UploadTaskSnapshot>(uploadTask, storageRef);

  if (status === 'loading') {
    return <LoadingSpinner/>;
  }

  const {bytesTransferred, totalBytes} = uploadProgress;

  const percentComplete = Math.round(100 * (bytesTransferred / totalBytes)) + '%';
  console.log(`Uploading image: ${percentComplete} complete`);
  return <span>{percentComplete}</span>;
};

const ImageUploadButton = () => {
  const [uploadTask, setUploadTask] = useState<UploadTask | undefined>(undefined);
  const [imageRef, setImageRef] = useState<StorageReference | undefined>(undefined);
  const storage = useStorage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChange = (event: { target: { files: any; }; }) => {
    const fileList = event.target.files;
    const fileToUpload = fileList[0];
    const newRef = ref(storage, 'shared_image.jpg');
    setImageRef(newRef);

    const uploadTask = uploadBytesResumable(newRef, fileToUpload);

    uploadTask.then(() => {
      console.log('Upload complete');
      setUploadTask(undefined);
    });

    setUploadTask(uploadTask);
  };

  return (
    <>
      <input type={'file'} accept={'image/jpg'} onChange={onChange}/>
      {uploadTask && imageRef ?
        <UploadProgress uploadTask={uploadTask} storageRef={imageRef}/> :
        'Start an upload to view progress'}
    </>
  );
};

const FetchImage = ({storagePath}: React.PropsWithoutRef<{ storagePath: string }>) => {
  const storage = useStorage();
  const {status, data: imageURL} = useStorageDownloadURL(ref(storage, storagePath));

  if (status === 'loading') {
    return <LoadingSpinner/>;
  }

  return <img src={imageURL} alt={'demo download'} style={{width: '200px', height: '200px'}}/>;
};

// noinspection JSUnusedGlobalSymbols
export function Storage() {
  return (
    <>
      <CardSection title='Fetch image'>
        <AuthWrapper fallback={<span>Sign in to fetch the image</span>}>
          <FetchImage storagePath='shared_image.jpg'/>
        </AuthWrapper>
      </CardSection>
      <CardSection title='Upload image'>
        <AuthWrapper fallback={<span>Sign in to upload an image</span>}>
          <ImageUploadButton/>
        </AuthWrapper>
      </CardSection>
    </>
  );
}
