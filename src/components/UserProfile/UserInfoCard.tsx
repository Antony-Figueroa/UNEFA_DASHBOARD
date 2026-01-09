import { useModal } from "../../hooks/useModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-text-emphasis dark:text-white lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-text-secondary dark:text-text-tertiary">
                First Name
              </p>
              <p className="text-sm font-medium text-text-emphasis dark:text-white">
                Antony F.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-text-secondary dark:text-text-tertiary">
                Last Name
              </p>
              <p className="text-sm font-medium text-text-emphasis dark:text-white">
                Chowdhury
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-text-secondary dark:text-text-tertiary">
                Email address
              </p>
              <p className="text-sm font-medium text-text-emphasis dark:text-white">
                randomuser@pimjo.com
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-text-secondary dark:text-text-tertiary">
                Phone
              </p>
              <p className="text-sm font-medium text-text-emphasis dark:text-white">
                +09 363 398 46
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-text-secondary dark:text-text-tertiary">
                Bio
              </p>
              <p className="text-sm font-medium text-text-emphasis dark:text-white">
                Team Manager
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border-medium bg-bg-main px-4 py-3 text-sm font-medium text-text-primary shadow-theme-xs hover:bg-bg-secondary hover:text-text-emphasis dark:border-border-dark dark:bg-white/3 dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-white lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-3xl" showCloseButton>
        <div className="flex flex-col h-full bg-bg-main dark:bg-bg-dark">
          <ModalHeader className="shrink-0 pt-6 px-6 sm:pt-10 sm:px-12 bg-bg-main dark:bg-bg-dark border-b border-border-light dark:border-white/10">
            <div className="w-full">
              <h4 className="mb-1 text-2xl font-semibold text-text-emphasis dark:text-white">
                Edit Personal Information
              </h4>
              <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
                Update your details to keep your profile up-to-date.
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-6 sm:py-10 bg-bg-secondary/30 dark:bg-white/2">
            <form id="user-info-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-7">
              <div>
                <h5 className="mb-5 text-lg font-medium text-text-emphasis dark:text-white lg:mb-6">
                  Social Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      type="text"
                      defaultValue="https://www.facebook.com/PimjoHQ"
                    />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input type="text" defaultValue="https://x.com/PimjoHQ" />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input
                      type="text"
                      defaultValue="https://www.linkedin.com/company/pimjo"
                    />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" defaultValue="https://instagram.com/PimjoHQ" />
                  </div>
                </div>
              </div>
              <div>
                <h5 className="mb-5 text-lg font-medium text-text-emphasis dark:text-white lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" defaultValue="Antony F." />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" defaultValue="Chowdhury" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" defaultValue="randomuser@pimjo.com" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" defaultValue="+09 363 398 46" />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" defaultValue="Team Manager" />
                  </div>
                </div>
              </div>
            </form>
          </ModalBody>

          <ModalFooter className="shrink-0">
            <Button size="sm" variant="outline" onClick={closeModal} className="flex-1 sm:flex-none">
              Close
            </Button>
            <Button size="sm" type="submit" form="user-info-form" className="flex-1 sm:flex-none">
              Save Changes
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
