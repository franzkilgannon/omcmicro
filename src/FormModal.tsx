import { useEffect, useId, useRef, useState } from 'react'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'select'
  | 'number'
  | 'datalist'
  | 'checkboxes'

/** Separator used to pack multi-select (checkboxes) values into a FormValues string. */
export const CHECKBOX_SEPARATOR = '|'

export interface FormField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: readonly string[]
  defaultValue?: string
  placeholder?: string
  hint?: string
}

export type FormValues = Record<string, string>

export interface FormModalConfig {
  title: string
  description?: string
  submitLabel: string
  fields: FormField[]
  onSubmit: (values: FormValues) => void
}

function initialValues(fields: FormField[]): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    values[field.name] =
      field.defaultValue ?? (field.type === 'select' ? field.options?.[0] ?? '' : '')
  }
  return values
}

export function FormModal({
  config,
  onClose,
}: {
  config: FormModalConfig
  onClose: () => void
}) {
  const [values, setValues] = useState<FormValues>(() => initialValues(config.fields))
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const titleId = useId()
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: false }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const nextErrors: Record<string, boolean> = {}
    for (const field of config.fields) {
      if (field.required && !values[field.name]?.trim()) nextErrors[field.name] = true
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const trimmed: FormValues = {}
    for (const [key, value] of Object.entries(values)) trimmed[key] = value.trim()
    config.onSubmit(trimmed)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{config.title}</h2>
            {config.description && <p>{config.description}</p>}
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close form"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {config.fields.map((field, index) => {
            const fieldId = `${titleId}-${field.name}`
            const invalid = Boolean(errors[field.name])
            const sharedProps = {
              id: fieldId,
              value: values[field.name] ?? '',
              'aria-invalid': invalid,
              className: invalid ? 'invalid' : undefined,
              required: field.required,
            }

            if (field.type === 'checkboxes') {
              const selected = (values[field.name] ?? '')
                .split(CHECKBOX_SEPARATOR)
                .filter(Boolean)
              return (
                <div className="modal-field" key={field.name}>
                  <span>
                    {field.label}
                    {field.required && <em aria-hidden="true"> *</em>}
                  </span>
                  <div className="modal-checkbox-group">
                    {field.options?.map((option) => {
                      const checked = selected.includes(option)
                      return (
                        <label className="modal-checkbox" key={option}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? selected.filter((item) => item !== option)
                                : [...selected, option]
                              setField(field.name, next.join(CHECKBOX_SEPARATOR))
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      )
                    })}
                  </div>
                  {field.hint && <small className="modal-hint">{field.hint}</small>}
                </div>
              )
            }

            return (
              <label className="modal-field" key={field.name} htmlFor={fieldId}>
                <span>
                  {field.label}
                  {field.required && <em aria-hidden="true"> *</em>}
                </span>

                {field.type === 'textarea' ? (
                  <textarea
                    {...sharedProps}
                    ref={index === 0 ? (firstFieldRef as React.Ref<HTMLTextAreaElement>) : undefined}
                    rows={3}
                    placeholder={field.placeholder}
                    onChange={(event) => setField(field.name, event.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select
                    {...sharedProps}
                    ref={index === 0 ? (firstFieldRef as React.Ref<HTMLSelectElement>) : undefined}
                    onChange={(event) => setField(field.name, event.target.value)}
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'datalist' ? (
                  <>
                    <input
                      {...sharedProps}
                      ref={index === 0 ? (firstFieldRef as React.Ref<HTMLInputElement>) : undefined}
                      type="text"
                      list={`${fieldId}-options`}
                      placeholder={field.placeholder}
                      onChange={(event) => setField(field.name, event.target.value)}
                    />
                    <datalist id={`${fieldId}-options`}>
                      {field.options?.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <input
                    {...sharedProps}
                    ref={index === 0 ? (firstFieldRef as React.Ref<HTMLInputElement>) : undefined}
                    type={field.type}
                    placeholder={field.placeholder}
                    onChange={(event) => setField(field.name, event.target.value)}
                  />
                )}

                {field.hint && <small className="modal-hint">{field.hint}</small>}
                {invalid && <small className="modal-error">This field is required.</small>}
              </label>
            )
          })}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              {config.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
