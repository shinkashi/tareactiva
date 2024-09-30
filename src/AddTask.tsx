import React, { useRef } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Task } from './task'; // Adjust the import path as needed
import { taskRepo } from './task'; // Adjust the import path as needed

function AddTask({ trigger }: { trigger: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = inputRef?.current?.value as string;
    if (!name) return;
    const task = new Task({ name });
    await taskRepo.add(task);
    trigger();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="formText">
        <div className="d-flex">
          <Form.Control
            type="text"
            placeholder="Enter new task"
            ref={inputRef}
          />
          <Button variant="primary" type="submit">
            Add
          </Button>
        </div>
      </Form.Group>
    </Form>
  );
}

export default AddTask;