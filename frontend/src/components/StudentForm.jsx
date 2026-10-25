import React from 'react';
import Modal from './Modal.jsx';
import { TextInput, SelectInput } from './FormField.jsx';
import { useForm } from '../hooks/useForm.js';

const GENDER_OPTIONS = [
  { value: 'male', label: 'male' },
  { value: 'female', label: 'female' },
  { value: 'other', label: 'other' },
];

const EMPTY_FORM = {
  full_name: '',
  student_code: '',
  email: '',
  phone: '',
  gender: 'male',
  password: '',
};

export default function StudentForm({ open, editing, onClose, onSubmit }) {
  const { values, handleChange, setAll, reset } = useForm(EMPTY_FORM);

  const isEdit = !!editing;

  React.useEffect(() => {
    if (open) {
      if (editing) {
        setAll({
          full_name: editing.full_name,
          student_code: editing.student_code,
          email: editing.email,
          phone: editing.phone || '',
          gender: editing.gender || 'male',
          password: '',
        });
      } else {
        reset();
      }
    }
  }, [open, editing, setAll, reset]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Modal title={isEdit ? 'Edit Student' : 'Add Student'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Full Name"
          name="full_name"
          value={values.full_name}
          onChange={handleChange}
          required
        />
        <TextInput
          label="Student Code"
          name="student_code"
          value={values.student_code}
          onChange={handleChange}
          placeholder="Leave blank to auto-generate"
        />
        <TextInput
          label="Email"
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          required
        />
        <TextInput
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={handleChange}
        />
        <SelectInput
          label="Gender"
          name="gender"
          value={values.gender}
          onChange={handleChange}
          options={GENDER_OPTIONS}
        />
        {!isEdit && (
          <TextInput
            label="Temporary Password (min 6 chars)"
            type="password"
            name="password"
            value={values.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save Changes' : 'Create Student'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
