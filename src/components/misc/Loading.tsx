import {Transition} from '@headlessui/react';
import * as React from 'react';


export const LoadingSpinner = () => {
  return (
    <div className={'animate-pulse p-4'}>
      <span>Loading...</span>
    </div>
  );
};

export const LoadingFullBlur = ({label, show}: React.PropsWithoutRef<{ label: string, show: boolean }>) => {
  return (
    <Transition
      show={show}
      enter={'ease-out duration-0'}
      enterFrom={'opacity-100'}
      enterTo={'opacity-100'}
      leave={'ease-in duration-500'}
      leaveFrom={'opacity-100'}
      leaveTo={'opacity-0'}
    >
      <div className={'flex absolute top-0 left-0 z-10 w-full h-full bg-white backdrop-blur-sm'}>
        <span className={'m-auto sm:mt-72 sm:mx-auto font-bold text-2xl text-gray-700'}>
          <p className={'animate-pulse'}>{label}...</p>
        </span>
      </div>
    </Transition>
  );
};
