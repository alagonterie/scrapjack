import React, {useState} from 'react';
import {DotsHorizontalIcon} from '@heroicons/react/outline';
import {useCallable} from '../../hooks/callableHooks';
import {CallableOptions} from '../../enums';


export const SubmitTextAsyncRequest =
  ({label, placeholder, icon, description, min, max, callableName, onSuccess}: React.PropsWithoutRef<{
    label: string, placeholder: string, icon: JSX.Element,
    description: string, min: number, max: number, callableName: CallableOptions, onSuccess?: (_: string | null) => void
  }>) => {
    const [textInput, setTextInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const callable = useCallable(callableName);
    const clickHandler = async () => {
      const text = textInput;
      if (text.length < min || text.length > max) {
        return;
      }

      setTextInput('');
      setIsSending(true);
      await callable(text)
        .then(() => {
          if (onSuccess) {
            onSuccess(text);
          }
          setIsValid(true);
        })
        .catch(() => {
          setIsValid(false);
        });
      setIsSending(false);
    };

    return (
      <div className={'flex p-3 sm:p-4 rounded border'}>
        <div className={'pr-6 font-medium'}>
          {label}
        </div>
        <div className={'flex flex-col w-full'}>
          <div className={'flex'}>
            <input
              className={
                (isValid === true ? 'ring-2 ring-green-500 ' :
                  isValid === false ? 'ring-2 ring-red-500 ' : '') +
                'w-full mr-2 py-1.5 px-3 rounded bg-gray-200 ' +
                'hover:shadow-inner focus:bg-white focus:outline-blue-500'}
              value={textInput}
              onInput={(event) => setTextInput((event.target as HTMLInputElement).value)}
              placeholder={placeholder}
              minLength={min}
              maxLength={max}
            />
            <button
              disabled={isSending}
              onClick={clickHandler}
            >
              <div
                className={'bg-gray-100 border-gray-300 h-10 w-10 p-1 border-2 rounded ' +
                  'hover:bg-gray-200 active:bg-gray-300'}
              >
                {isSending ? <DotsHorizontalIcon className={'w-7 h-7 text-gray-600'}/> : icon}
              </div>
            </button>
          </div>
          <div className={(isValid === false ? 'text-red-600 ' :
            isValid === true ? 'text-green-600 ' : '') + 'text-sm text-gray-500 mt-3'}
          >
            {isValid === false ? `Invalid ${label.toLowerCase()}` :
              isValid === true ? 'Updated successfully' : description}
          </div>
        </div>
      </div>
    );
  };
