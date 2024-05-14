import React, {Fragment, useContext} from 'react';
import {Dialog, Tab, Transition} from '@headlessui/react';
import {XIcon, SaveIcon} from '@heroicons/react/outline';
import {SubmitTextAsyncRequest} from './input/Submit';
import {UserContext} from './Presence';
import {UpdateProfilePicture} from './misc/ProfilePicture';


const settingsTabs = ['Profile', 'Preferences'];

export const SettingsSlider =
  ({
    tabIndex, setSettingsTab
  }: React.PropsWithoutRef<{
    tabIndex: number, setSettingsTab: React.Dispatch<React.SetStateAction<number>>
  }>) => {
    return (
      <Transition.Root show={tabIndex !== -1} as={Fragment}>
        <Dialog as={'div'} className={'fixed inset-0 z-20 overflow-hidden'} onClose={() => setSettingsTab(-1)}>
          <div className={'absolute inset-0 overflow-hidden'}>
            {/* OVERLAY*/}
            <Transition.Child
              as={Fragment}
              enter={'ease-in-out duration-500'}
              enterFrom={'opacity-0'}
              enterTo={'opacity-100'}
              leave={'ease-in-out duration-500'}
              leaveFrom={'opacity-100'}
              leaveTo={'opacity-0'}
            >
              <Dialog.Overlay className={'absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity'}/>
            </Transition.Child>
            {/* WHOLE CONTAINER*/}
            <div className={'fixed inset-y-0 right-0 sm:pl-10 max-w-full flex'}>
              <Transition.Child
                as={Fragment}
                enter={'transform transition ease-in-out duration-500 sm:duration-700'}
                enterFrom={'translate-x-full'}
                enterTo={'translate-x-0'}
                leave={'transform transition ease-in-out duration-500 sm:duration-700'}
                leaveFrom={'translate-x-0'}
                leaveTo={'translate-x-full'}
              >
                {/* PANEL CONTAINER*/}
                <div className={'relative w-screen mt-[64px] mb-[64px] sm:mb-0 sm:max-w-lg'}>
                  <Transition.Child
                    as={Fragment}
                    enter={'ease-in-out duration-500'}
                    enterFrom={'opacity-0'}
                    enterTo={'opacity-100'}
                    leave={'ease-in-out duration-500'}
                    leaveFrom={'opacity-100'}
                    leaveTo={'opacity-0'}
                  >
                    {/* BUTTON CONTAINER*/}
                    <div className={'absolute flex top-0 right-0 z-30 mt-4 mr-4'}
                    >
                      <button onClick={() => setSettingsTab(-1)}>
                        <span className={'sr-only'}>Close panel</span>
                        <XIcon className={'h-9 w-9 sm:h-6 text-gray-600 ring-2 rounded bg-white ' +
                          'sm:shadow-none hover:bg-gray-100 active:bg-gray-300'}/>
                      </button>
                    </div>
                  </Transition.Child>
                  {/* PANEL CONTENT CONTAINER*/}
                  <PanelContent tabIndex={tabIndex}/>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  };

const PanelContent = ({tabIndex}: React.PropsWithoutRef<{ tabIndex: number }>) => {
  const {user, setUser} = useContext(UserContext);
  const successHandler = (newUsername: string | null) => {
    setUser(newUsername);
  };

  return (
    <div className={'h-full flex flex-col pt-6 -mr-4 sm:mr-0 bg-white shadow-xl sm:rounded-l-2xl'}>
      <Tab.Group defaultIndex={tabIndex}>
        <Tab.List className={'px-4 sm:px-6'}>
          <Dialog.Title className={'mb-4 text-3xl text-gray-900'}>
            Settings
          </Dialog.Title>
          {settingsTabs.map((tabName) => {
            return (
              <Tab key={tabName} className={({selected}) => 'mr-6 text-lg sm:text-base ' +
                (selected ? 'text-blue-500 border-b border-blue-500' : 'text-black')
              }>
                {tabName}
              </Tab>
            );
          })}
        </Tab.List>
        <div className={'relative flex-1 border-t px-4 sm:px-6'}>
          <Tab.Panels>
            <Tab.Panel>
              <TabContentContainer>
                <TabContentSection label={'Profile Picture'}>
                  <UpdateProfilePicture/>
                </TabContentSection>
                <TabContentSection
                  label={'Profile Settings'}
                  description={'Change identifying details for your account'}
                >
                  <SubmitTextAsyncRequest
                    label={'Username'}
                    placeholder={user ?? 'Choose a username'}
                    icon={<SaveIcon className={'w-7 h-7 text-gray-600'}/>}
                    description={'You may update your username'}
                    min={2}
                    max={26}
                    callableName={'profiles-updateDisplayname'}
                    onSuccess={successHandler}
                  />
                </TabContentSection>
                <ul>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((value) => {
                    return (
                      <li key={value} className={'text-8xl font-light'}>
                        {value}
                      </li>
                    );
                  })}
                </ul>
              </TabContentContainer>
            </Tab.Panel>
            <Tab.Panel>
              <TabContentContainer>
                <ul>
                  {[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((value) => {
                    return (
                      <li key={value} className={'text-8xl font-light'}>
                        {value}
                      </li>
                    );
                  })}
                </ul>
              </TabContentContainer>
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </div>
  );
};

const TabContentContainer: React.FC = ({children}) => {
  return (
    <div className={'absolute inset-0 overflow-y-scroll'}>
      <div className={'h-full pt-6 pl-4 sm:pl-6 pr-8 sm:pr-7 shadow-inner'} aria-hidden={'true'}>
        {children}
      </div>
    </div>
  );
};

const TabContentSection =
  ({
    children, label, description
  }: React.PropsWithChildren<{
    label: string, description?: string
  }>) => {
    return (
      <div className={'mb-8'}>
        <div className={'text-lg font-medium'}>
          {label}
        </div>
        {description &&
          <div className={'text-sm text-gray-500 mt-1'}>
            {description}
          </div>}
        <div className={'mt-5'}>
          {children}
        </div>
      </div>
    );
  };
