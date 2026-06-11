/**
 * Campos controlados — puente entre react-hook-form y el kit UI.
 * Cada campo conecta value/onChange/onBlur vía <Controller> y muestra el
 * mensaje de error del esquema yup cuando el campo ya fue tocado.
 */
import React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import type { TextInputProps } from 'react-native'
import { DateField } from '../components/DateField'
import { Input, SelectSheet } from '../components/ui'

type Common<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: Common<T> & TextInputProps & { label?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState, formState }) => (
        <Input
          label={label}
          {...props}
          value={(field.value as string) ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.isTouched || formState.submitCount > 0 ? fieldState.error?.message : undefined}
        />
      )}
    />
  )
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
}: Common<T> & {
  label?: string
  options: { value: string; title: string; icon?: string }[]
  placeholder?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectSheet
          label={label}
          placeholder={placeholder}
          value={((field.value as string) ?? '') as never}
          options={options as never}
          onChange={(v) => field.onChange(v)}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

export function FormDate<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: Common<T> & { label?: string; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          label={label}
          placeholder={placeholder}
          value={(field.value as string) ?? ''}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}
