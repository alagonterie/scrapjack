import {useAuth, useStorage, useUser} from 'reactfire';
import {RefreshIcon, TrashIcon, XIcon, ZoomInIcon} from '@heroicons/react/outline';
import React, {ChangeEventHandler, useCallback, useState} from 'react';
import Cropper from 'react-easy-crop';
import {getOrientation, Orientation} from 'get-orientation/browser';
import {getCroppedImg, getRotatedImage} from '../../helpers/canvasUtils';
import {getDownloadURL, ref, deleteObject, uploadBytesResumable} from 'firebase/storage';
import {updateProfile} from 'firebase/auth';
import {defaultPhotoURL} from '../../constants';
import {SpinnerSvg} from './SVG';


type tOrientationOptions = {
  [key: string]: number
}

const ORIENTATION_TO_ANGLE: tOrientationOptions = {
  '3': 180,
  '6': 90,
  '8': -90,
};

interface area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropper =
  ({
    imageSrc, setIsOpen
  }: React.PropsWithoutRef<{
    imageSrc: string, setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  }>) => {
    const auth = useAuth();
    const storage = useStorage();
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<area | null>(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const saveCroppedImage = useCallback(async () => {
      try {
        const croppedImage = await getCroppedImg(
          imageSrc as string,
          croppedAreaPixels as area,
          rotation
        );

        const newRef = ref(storage, `${auth.currentUser?.uid}/photo.jpeg`);
        await uploadBytesResumable(newRef, croppedImage as Blob);
        const newUrl = await getDownloadURL(newRef);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {photoURL: newUrl});
        }

        setIsOpen(false);
      } catch (e) {
        console.error(e);
      }
    }, [imageSrc, croppedAreaPixels, rotation, storage, auth.currentUser, setIsOpen]);

    return (
      <>
        <div className={'fixed z-[999] bg-gray-50 rounded-md h-[460px] sm:h-[525px] w-80 sm:w-[590px] ' +
          'top-[50%] -translate-y-[50%] left-[50%] -translate-x-[50%]'}
        >
          <div className={'h-10'}>
            <div className={'w-fit mx-auto translate-y-2 font-medium'}>
              Update Profile Picture
            </div>
            <button
              className={'absolute right-0 top-0 p-2.5'}
              onClick={() => setIsOpen(false)}
            >
              <XIcon className={'w-5 h-5'}/>
            </button>
          </div>
          <div className={'relative sm:w-[590px] h-[300px] sm:h-[420px] bg-gray-300'}>
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={rotation}
              zoom={zoom}
              aspect={1}
              cropShape={'round'}
              showGrid={false}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className={'p-4 flex flex-col sm:flex-row items-stretch sm:items-center'}>
            <div className={'flex flex-1 items-center mb-1 sm:mb-0 sm:mr-6'}>
              <ZoomInIcon className={'h-6 w-6 text-gray-600 mr-2'}/>
              <Slider
                min={1}
                max={5}
                step={0.1}
                onChange={(e) => setZoom(e.target.valueAsNumber)}
              />
            </div>
            <div className={'flex flex-1 items-center sm:mr-6'}>
              <RefreshIcon className={'h-6 w-6 text-gray-600 mr-2'}/>
              <Slider
                min={0}
                max={360}
                step={1}
                onChange={(e) => setRotation(e.target.valueAsNumber)}
              />
            </div>
            <div className={'flex justify-between mt-2 sm:mt-0'}>
              <button
                className={'sm:mr-3 bg-gray-100 rounded text-gray-600 font-medium px-2 py-1 hover:bg-gray-200'}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className={'bg-blue-500 text-green-50 rounded font-medium px-2 py-1 hover:bg-blue-600'}
                onClick={saveCroppedImage}
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <div className={'z-[998] fixed w-screen h-screen top-0 left-0 bg-black opacity-80'}/>
      </>
    );
  };

const Slider =
  ({
    min, max, step, onChange
  }: React.PropsWithoutRef<{
    min: number; max: number; step: number; onChange: ChangeEventHandler<HTMLInputElement>
  }>) => {
    return (
      <input
        type={'range'}
        className={'appearance-none w-full h-[2px] rounded-full p-0 bg-gray-300'}
        defaultValue={min}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
    );
  };

const readFile = (file: Blob): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), false);
    reader.readAsDataURL(file);
  });
};

export const UpdateProfilePicture = () => {
  const storage = useStorage();
  const {data: user} = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);

      // apply rotation if needed
      let orientation: Orientation;
      try {
        orientation = await getOrientation(file);
      } catch (_) {
        orientation = Orientation.TOP_LEFT;
      }

      const rotation = ORIENTATION_TO_ANGLE[Orientation[orientation]];
      if (rotation) {
        imageDataUrl = await getRotatedImage(imageDataUrl as string, rotation);
      }

      setImageSrc(imageDataUrl as string);
      setIsOpen(true);
    }
  };

  const deleteHandler = async () => {
    setIsDeleting(true);
    const imageRef = ref(storage, `${user?.uid}/photo.jpeg`);
    deleteObject(imageRef).finally(async () => {
      if (user) {
        await updateProfile(user, {photoURL: defaultPhotoURL});
      }

      setIsDeleting(false);
    });
  };

  const deleteStyle = 'w-6 h-6 text-blue-700';
  return (
    <div className={'flex p-3 sm:p-4 rounded border'}>
      <div className={''}>
        <img
          className={'w-20 h-20 mr-16 sm:mr-6 rounded-full pointer-events-none'}
          src={user?.photoURL ?? defaultPhotoURL}
          alt={'Your avatar'}
        />
      </div>
      <div className={'my-auto'}>
        <div className={'flex mb-2'}>
          <label className={'bg-gray-100 text-sm font-medium border-2 border-gray-300 rounded py-1 px-4 mr-2 ' +
            'hover:bg-gray-200 active:bg-gray-300'}
          >
            <input
              className={'hidden'}
              type="file"
              accept="image/*"
              onClick={() => setIsOpen(true)}
              onChange={async (e) => await onFileChange(e)}
            />
            Update Profile Picture
          </label>
          <button
            className={'rounded px-1.5 hover:bg-gray-200 active:bg-gray-300'}
            onClick={deleteHandler}
          >
            {!isDeleting ? <TrashIcon className={deleteStyle}/> : <SpinnerSvg className={deleteStyle}/>}
          </button>
        </div>
        <div className={'text-sm text-gray-500'}>
          Must be JPEG, PNG, or GIF and cannot exceed 10MB.
        </div>
      </div>
      {imageSrc && isOpen && <ImageCropper imageSrc={imageSrc} setIsOpen={setIsOpen}/>}
    </div>
  );
};
