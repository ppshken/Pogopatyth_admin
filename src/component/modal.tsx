"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";

type ModalProps = {
  header?: string;
  msg?: string;
  id?: number;
  onConfirm?: (id: number) => void;
  onClose?: () => void;
};

export function ModalComponent({ header, msg, id, onConfirm, onClose }: ModalProps) {
  const handleDelete = () => {
    if (id && onConfirm) {
      onConfirm(id);
    }
    if (onClose) onClose();
  };

  return (
    <Modal show={true} onClose={onClose}>
      <ModalHeader>{header}</ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
            {msg}
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={handleDelete} color="red">
          Delete
        </Button>
        <Button color="alternative" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
