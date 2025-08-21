"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { useState } from "react";

type modal = {
  header?: string;
  msg?: string;
};

export function ModalComponent({ header, msg }: modal) {
  const [openModal, setOpenModal] = useState(true);

  return (
    <>
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <ModalHeader>{header}</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {msg}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setOpenModal(false)} color="red">
            Delete
          </Button>
          <Button color="alternative" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
