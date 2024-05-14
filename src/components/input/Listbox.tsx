import {Listbox, Transition} from '@headlessui/react';
import React, {Fragment, useEffect} from 'react';
import {SelectorIcon} from '@heroicons/react/solid';


export interface ListboxSelection {
  id: number;
  value: number | string;
}

export const MyListbox = ({
  selections,
  getter,
  setter,
  label,
  isFirstSelectionDefault = true
}: React.PropsWithoutRef<{
  selections: ListboxSelection[],
  getter: ListboxSelection,
  setter: React.Dispatch<React.SetStateAction<ListboxSelection>>,
  label?: string
  isFirstSelectionDefault?: boolean
}>) => {
  useEffect(() => {
    setter(selections[isFirstSelectionDefault ? 0 : selections.length - 1]);
  }, [selections]);

  return (
    <Listbox value={getter} onChange={setter}>
      <div className={'relative h-fit pb-2 my-auto'}>
        <Listbox.Button
          className={'flex flex-row relative w-fit h-fit pr-5 text-left bg-white rounded cursor-default'}
        >
          {label &&
            <Listbox.Label className={'my-auto text-gray-700'}>
              {label}:
            </Listbox.Label>}
          <span className={'block truncate px-2'}>{getter.value}</span>
          <span className={'absolute inset-y-0 right-0 flex items-center pointer-events-none'}>
            <SelectorIcon
              className={'w-5 h-5 text-gray-400'}
              aria-hidden={'true'}
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave={'transition ease-in duration-100'}
          leaveFrom={'opacity-100'}
          leaveTo={'opacity-0'}
        >
          <Listbox.Options
            className={'absolute w-full z-10 py-1 mt-2 overflow-auto text-base bg-white rounded ' +
              'shadow-lg max-h-70 ring-1 ring-black ring-opacity-5 focus:outline-none'}
          >
            {selections.map((person) => (
              <Listbox.Option
                key={person.id}
                className={({active}) =>
                  `${active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'}
                          cursor-default select-none relative py-3 sm:py-2 px-4`
                }
                value={person}
              >
                {({selected, active}) => (
                  <>
                    <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                      {person.value}
                    </span>
                    {selected &&
                      <span
                        className={`${active ? 'text-blue-600' : 'text-blue-600'}
                                    absolute inset-y-0 left-0 flex items-center pl-3`}
                      />}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};
