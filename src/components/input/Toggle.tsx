import * as React from 'react';
import {Switch} from '@headlessui/react';


export const Toggle = ({
  getter,
  setter
}: React.PropsWithoutRef<{
  getter: boolean;
  setter: React.Dispatch<React.SetStateAction<boolean>>;
}>) => {
  return (
    <Switch
      checked={getter}
      onChange={setter}
      className={`${getter ? 'bg-blue-700' : 'bg-gray-600'}
          relative inline-flex flex-shrink-0 h-[20px] w-[37px] border-2 border-transparent rounded-full cursor-pointer 
          transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white 
          focus-visible:ring-opacity-75`}
    >
      <span className={'sr-only'}>Use setting</span>
      <span
        aria-hidden={'true'}
        className={`${getter ? 'translate-x-[17px]' : 'translate-x-0'}
            pointer-events-none inline-block h-[16px] w-[16px] rounded-full bg-white shadow-lg transform ring-0 
            transition ease-in-out duration-200`}
      />
    </Switch>
  );
};
