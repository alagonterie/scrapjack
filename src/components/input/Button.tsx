import * as React from 'react';
import {SpinnerSvg} from '../misc/SVG';
import {ColorOptions} from '../../enums';


export const LargeButton =
  ({
    onClick,
    icon,
    label,
    isLoading,
    isDisabled,
    loadingLabel
  }: {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    icon: JSX.Element;
    label: string;
    isLoading: boolean;
    isDisabled: boolean;
    loadingLabel: string;
  }) => {
    return (
      <button
        className={'bg-blue-500 h-10 w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'}
        onClick={onClick}
        disabled={isDisabled || isLoading}
      >
        <div className={'flex'}>
          <span className={'my-auto'}>{isLoading ? <SpinnerSvg/> : icon}</span>
          <span className={'mx-auto'}>{isLoading ? `${loadingLabel}...` : label}</span>
        </div>
      </button>
    );
  };

export const SmallButton =
  ({
    onClick,
    label,
    isLoading,
    isDisabled
  }: {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    label: string;
    isLoading: boolean;
    isDisabled: boolean;
  }) => {
    return (
      <div>
        <button
          className={'bg-blue-500 h-10 w-20 transition hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'}
          onClick={onClick}
          disabled={isDisabled || isLoading}
        >
          <div className={'flex justify-center'}>
            <span className={'my-auto'}>{isLoading ? <SpinnerSvg/> : label}</span>
          </div>
        </button>
      </div>
    );
  };

export const SkinnyButton =
  ({
    onClick,
    label,
    isLoading,
    isDisabled,
    tall = false,
    color = 'blue'
  }: {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    label: string;
    isLoading: boolean;
    isDisabled: boolean;
    tall?: boolean;
    color?: ColorOptions;
  }) => {
    return (
      <div className={tall ? '' : 'h-[30px]'}>
        <button
          className={`${tall ? 'h-full' : 'h-[30px]'} ${!isDisabled ?
            color === 'green' ?
              'bg-green-600 hover:bg-green-700' :
              color === 'red' ?
                'bg-red-700 hover:bg-red-800' :
                'bg-blue-500 hover:bg-blue-700' :
            'bg-gray-500'} 
            text-white text-sm transition font-medium py-1 px-1 rounded`}
          onClick={onClick}
          disabled={isDisabled || isLoading}
        >
          <div className={'w-12 flex justify-center'}>
            <span className={'my-auto'}>{isLoading ? <SpinnerSvg/> : label}</span>
          </div>
        </button>
      </div>
    );
  };

export const MiniButton =
  ({
    onClick,
    icon,
    isLoading,
    isDisabled
  }: {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    icon: JSX.Element;
    isLoading: boolean;
    isDisabled: boolean;
  }) => {
    return (
      <button
        className={(isDisabled ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-700') +
          ' text-white font-bold pl-2.5 py-1 pr-2 rounded'}
        onClick={onClick}
        disabled={isDisabled || isLoading}
      >
        <span className={'m-auto'}>{isLoading ? <SpinnerSvg/> : icon}</span>
      </button>
    );
  };
