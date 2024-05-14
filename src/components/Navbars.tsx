import React, {Fragment, useContext, useState} from 'react';
import {Menu, Transition} from '@headlessui/react';
import {BellIcon} from '@heroicons/react/outline';
import {NavigationContext} from '../App';
import {useAuth, useSigninCheck} from 'reactfire';
import {LoadingSpinner} from './misc/Loading';
import {signIn, signOut} from './Authentication';
import {SettingsSlider} from './Slider';
import {UserContext} from './Presence';
import {toPossessive} from '../helpers/format';
import {defaultPhotoURL} from '../constants';

const navigationOptions = ['Home', 'Play', 'Watch', 'Create'];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const TopNavbar = () => {
  return (
    <nav className={'bg-gray-800 fixed inset-x-0 z-50'}>
      <div className={'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8'}>
        <div className={'relative flex items-center justify-between h-16'}>
          <NavContent/>
          <UserContent/>
        </div>
      </div>
    </nav>
  );
};

export const BottomNavbar = () => {
  return (
    <section className={'sm:hidden h-16 block fixed inset-x-0 bottom-0 z-50 py-4 bg-gray-800 shadow-t-md'}>
      <div className={'flex justify-around'}>
        <BottomNavButtons/>
      </div>
    </section>
  );
};

const NavContent = () => {
  return (
    <div className={'flex-1 flex items-center justify-center sm:items-stretch sm:justify-start'}>
      <div className={'flex-shrink-0 flex items-center'}>
        <img
          className={'block mr-4 h-8 w-auto pointer-events-none'}
          src={'https://i.imgur.com/NqMBmLB.png'}
          alt={'Chunk'}
        />
        <img
          className={'hidden lg:block h-8 w-auto pointer-events-none'}
          src={'https://i.imgur.com/Jt5aRAW.png'}
          alt={'Scrapjack'}
        />
      </div>
      <HeaderNavButtons/>
    </div>
  );
};

const UserContent = () => {
  return (
    <div className={'absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0'}>
      <button
        type={'button'}
        className={'bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white ' +
          'hover:outline-none hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800 hover:ring-white'}
      >
        <span className={'sr-only'}>View notifications</span>
        <BellIcon className={'h-6 w-6'} aria-hidden={'true'}/>
      </button>
      <ProfileDropdown/>
    </div>
  );
};

const HeaderNavButtons = () => {
  const {navigation, setNavigation} = useContext(NavigationContext);

  const clickHandler = (nextNavigation: string) => {
    setNavigation(nextNavigation.toUpperCase());
  };

  return (
    <div className={'hidden sm:block sm:ml-6'}>
      <div className={'flex space-x-4'}>
        {navigationOptions.map((navigationOption) => {
          const isCurrent = navigation === navigationOption.toUpperCase();
          return (
            <button
              key={navigationOption}
              className={classNames(
                isCurrent ?
                  'bg-gray-900 text-white' :
                  'text-gray-300 hover:bg-gray-700 hover:text-white',
                'px-3 py-2 rounded-md text-sm font-medium'
              )}
              onClick={() => clickHandler(navigationOption)}
            >
              {navigationOption}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const BottomNavButtons = () => {
  const {navigation, setNavigation} = useContext(NavigationContext);

  const clickHandler = (nextNavigation: string) => {
    setNavigation(nextNavigation.toUpperCase());
  };

  return (
    <>
      {navigationOptions.map((navigationOption) => {
        const isCurrent = navigation === navigationOption.toUpperCase();
        return (
          <button
            key={navigationOption}
            className={classNames(
              isCurrent ?
                'bg-gray-900 text-white' :
                'text-gray-300 hover:bg-gray-700 hover:text-white',
              'px-3 py-2 rounded-md text-sm font-medium'
            )}
            onClick={() => clickHandler(navigationOption)}
          >
            {navigationOption}
          </button>
        );
      })}
    </>
  );
};

const ProfileDropdown = () => {
  const [settingsTab, setSettingsTab] = useState(-1);

  return (
    <Menu as={'div'} className={'ml-3 relative'}>
      <SettingsSlider tabIndex={settingsTab} setSettingsTab={setSettingsTab}/>
      <ProfileMenuButton/>
      <Transition
        as={Fragment}
        enter={'transition ease-out duration-100'}
        enterFrom={'transform opacity-0 scale-95'}
        enterTo={'transform opacity-100 scale-100'}
        leave={'transition ease-in duration-75'}
        leaveFrom={'transform opacity-100 scale-100'}
        leaveTo={'transform opacity-0 scale-95'}
      >
        <Menu.Items
          className={'origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ' +
            'ring-1 ring-black ring-opacity-5 focus:outline-none'}
        >
          <ProfileMenuItemButtons setSettingsTab={setSettingsTab}/>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const ProfileMenuItemButtons =
  ({
    setSettingsTab
  }: React.PropsWithoutRef<{
    setSettingsTab: React.Dispatch<React.SetStateAction<number>>
  }>) => {
    const auth = useAuth();
    const {user, setUser} = useContext(UserContext);
    const {setNavigation} = useContext(NavigationContext);
    const {status, data: signInResult} = useSigninCheck();

    if (status === 'loading') {
      return <LoadingSpinner/>;
    }

    const signInHandler = async () => {
      signIn(auth).then((credential) => {
        setUser(credential.user.displayName);
      });
    };

    const signOutHandler = async () => {
      signOut(auth).then(() => {
        setUser(null);
        setNavigation('HOME');
      });
    };

    const {signedIn, user: signedInUser} = signInResult;
    return (
      <>
        {signedIn && signedInUser ?
          <>
            <ProfileMenuItemButton label={`${toPossessive(user as string)} profile`} onClick={() => setSettingsTab(0)}/>
            <ProfileMenuItemButton label={'Preferences'} onClick={() => setSettingsTab(1)}/>
            <ProfileMenuItemButton label={'Sign out'} onClick={signOutHandler}/>
          </> :
          <>
            <ProfileMenuItemButton label={'Sign in'} onClick={signInHandler}/>
          </>
        }
      </>
    );
  };

const ProfileMenuButton = () => {
  const {status, data: signInResult} = useSigninCheck();

  return (
    <Menu.Button
      className={'bg-gray-800 flex text-sm rounded-full ' +
        'hover:outline-none hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800 hover:ring-white'}
    >
      <span className={'sr-only'}>Open user menu</span>
      <img
        className={'h-8 w-8 rounded-full pointer-events-none'}
        src={status === 'loading' || !signInResult?.user?.photoURL ? defaultPhotoURL : signInResult.user.photoURL}
        alt={'avatar'}
      />
    </Menu.Button>
  );
};

const ProfileMenuItemButton =
  ({
    label,
    onClick
  }: React.PropsWithoutRef<{
    label: string,
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  }>) => {
    return (
      <Menu.Item>
        {({active}) => (
          <button
            className={classNames(active ? 'bg-gray-100' : '',
              'flex w-full px-4 py-3.5 text-sm text-gray-700 sm:py-2')}
            onClick={onClick}
          >
            {label}
          </button>
        )}
      </Menu.Item>
    );
  };
