import { Request } from "express";
import formidable from "formidable";

export type FormFieldType = "string" | "number" | "boolean";
export interface FormFieldProperty {
  name: string;
  type: FormFieldType;
}
export interface FormParsed<T> {
  fields: T;
  files?: formidable.Files<string>;
}

/**
 * Convert a piece of data to a specific type.
 * @param data The data to convert.
 * @param type The type to convert it to.
 */
function convertToType(data: any, type: FormFieldType): any {
  switch (type) {
    case "string":
      return String(data);
    case "number":
      return Number(data);
    case "boolean":
      return data != null;
  }
}

/**
 * Process form fields.
 * @param <T> A type for the fields property.
 * @param fields The `formidable.fields` data.
 * @returns Processed field data.
 */
export function processFormFields<T extends Object>(
  fields: formidable.Fields<string>,
  properties: FormFieldProperty[]
): T {
  let out: { [key: string]: any } = {};

  for (let key of properties) {
    out[key.name] = convertToType(fields[key.name], key.type);
  }

  return <T>out;
}

/**
 * Process form data.
 * @param form_data The `formidable` form data.
 * @returns An object representing
 */
export function processFormData<T extends Object>(
  form_data: [formidable.Fields<string>, formidable.Files<string>],
  properties: FormFieldProperty[]
): FormParsed<T> {
  let files = form_data[1] != null ? form_data[1] : null;
  return {
    fields: processFormFields<T>(form_data[0], properties),
    files,
  };
}

export default function getFormData<T extends Object>(
  req: Request,
  properties: FormFieldProperty[]
): Promise<FormParsed<T>> {
  return new Promise((resolve, reject) => {
    let form = formidable({});

    form
      .parse(req)
      .then((data) => {
        resolve(processFormData<T>(data, properties));
      })
      .catch(reject);
  });
}
