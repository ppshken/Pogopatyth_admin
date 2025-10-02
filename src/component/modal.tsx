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
  show?: boolean;
};

export function ModalComponent({
  header,
  msg,
  id,
  onConfirm,
  onClose,
}: ModalProps) {
  const handleDelete = () => {
    if (id && onConfirm) {
      onConfirm(id);
    }
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
          ยืนยัน
        </Button>
        <Button color="alternative" onClick={onClose}>
          ยกเลิก
        </Button>
      </ModalFooter>
    </Modal>
  );
}
