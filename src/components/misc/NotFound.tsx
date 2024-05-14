import * as React from 'react';


export const NoPage = ({message}: React.PropsWithoutRef<{ message?: string }>) => (
  <main className={'p-4'}>
    <p>{message ? message as string : 'There\'s nothing here!'}</p>
  </main>
);
