import { createContext } from 'react';
import type { ComponentRef } from 'react';
import type { TextInput } from 'react-native';

export type FormInput = ComponentRef<typeof TextInput>;
export const FormKeyboardContext = createContext<{
  focus: (input: FormInput | null) => void;
  blur: (input: FormInput | null) => void;
} | null>(null);
