import {Dialog, Transition} from '@headlessui/react';
import React, {Fragment, useContext, useEffect} from 'react';
import {ModalContext} from '../../App';
import {useFirestore, useUser} from 'reactfire';
import {doc, setDoc, deleteField} from 'firebase/firestore';


export const Modal = () => {
  const {data: user} = useUser();
  const firestore = useFirestore();
  const {isModalOpen, setIsModalOpen, modalType, setModalType} = useContext(ModalContext);

  useEffect(() => {
    if (modalType === 'KICK') {
      setDoc(doc(firestore, `status/${user?.uid}`), {isKicked: deleteField()}, {merge: true}).then();
    } else if (modalType === 'BAN') {
      setDoc(doc(firestore, `status/${user?.uid}`), {isBanned: deleteField()}, {merge: true}).then();
    }
  }, [firestore, modalType, user?.uid]);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalType('OKAY'), 200);
  };

  return (
    <Transition appear show={isModalOpen} as={Fragment}>
      <Dialog
        as={'div'}
        className={'fixed inset-0 z-[999] overflow-y-auto'}
        onClose={closeModal}
      >
        <div className={'min-h-screen px-4 text-center'}>
          <Transition.Child
            as={Fragment}
            enter={'ease-out duration-300'}
            enterFrom={'opacity-0'}
            enterTo={'opacity-100'}
            leave={'ease-in duration-200'}
            leaveFrom={'opacity-100'}
            leaveTo={'opacity-0'}
          >
            <Dialog.Overlay className={'fixed inset-0'}/>
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className={'inline-block h-screen align-middle'} aria-hidden={'true'}>
              &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter={'ease-out duration-300'}
            enterFrom={'opacity-0 scale-95'}
            enterTo={'opacity-100 scale-100'}
            leave={'ease-in duration-200'}
            leaveFrom={'opacity-100 scale-100'}
            leaveTo={'opacity-0 scale-95'}
          >
            <div
              className={'inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle ' +
                'transition-all transform bg-white shadow-xl rounded-2xl'}>
              <Dialog.Title
                as={'h3'}
                className={'text-lg font-medium leading-6 text-gray-900'}
              >
                {modalType === 'KICK' ?
                  'Kicked!' :
                  modalType === 'BAN' ?
                    'Banned!' :
                    'Something happened!'}
              </Dialog.Title>
              <div className={'mt-2'}>
                <p className={'text-sm text-gray-500'}>
                  {modalType === 'KICK' ?
                    'You were temporarily removed from the lobby by the host.' :
                    modalType === 'BAN' ?
                      'You were permanently banned from the lobby by the host.' :
                      'It must be important because it caused this dialog window to pop up.'}
                </p>
              </div>

              <div className={'mt-4'}>
                <button
                  type={'button'}
                  className={'inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 ' +
                    'border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 ' +
                    'focus-visible:ring-offset-2 focus-visible:ring-blue-500'}
                  onClick={closeModal}
                >
                  {modalType === 'KICK' ?
                    'Wow, okay.' :
                    modalType === 'BAN' ?
                      'That\'s sad, but I\'ll grow from this.' :
                      'Okay, cool.'}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
