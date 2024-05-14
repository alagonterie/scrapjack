import * as React from 'react';


export const CardContainer: React.FC = ({children}) => {
  return (
    <div className={'flex flex-col h-screen pt-[64px] sm:pt-[72px] pb-[72px]'}>
      {children}
    </div>
  );
};

export const Card =
  ({children, title, oneSection}: React.PropsWithChildren<{ title: string, oneSection?: boolean }>) => {
    return (
      <div className={'max-w-2xl w-full sm:rounded sm:shadow-md sm:shadow-gray-200 mx-auto sm:mb-3'}>
        <div className={'h-12 bg-blue-200 p-2 sm:rounded-t '}>
          <h2 className={'text-lg font-medium text-center'}>{title}</h2>
        </div>
        <div className={oneSection ? 'p-2' : ''}>
          {children}
        </div>
      </div>
    );
  };

export const CardSection = ({children, title}: React.PropsWithChildren<{ title: string }>) => {
  return (
    <div className={'w-full'}>
      <div className={'h-10 bg-blue-100 p-2'}>
        <h3>{title}</h3>
      </div>
      <div className={'p-2'}>
        {children}
      </div>
    </div>
  );
};
