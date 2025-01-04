import { Request } from "express";
import formidable from "formidable";

export type FormFieldType = "string" | "number" | "boolean";
export type FormFieldProperties = { [key: string]: FormFieldType };
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
  properties: FormFieldProperties
): T {
  let out: { [key: string]: any } = {};

  for (let key of Object.keys(properties)) {
    out[key] = convertToType(fields[key], properties[key]);
  }

  return <T>out;
}

/**
 * Process form data.
 * @param form_data The `formidable` form data.
 * @returns An object contained parsed data.
 */
export function processFormData<T extends Object>(
  form_data: [formidable.Fields<string>, formidable.Files<string>],
  properties: FormFieldProperties
): FormParsed<T> {
  return {
    fields: processFormFields<T>(form_data[0], properties),
    files: form_data[1] ?? null,
  };
}

export default function getFormData<T extends Object>(
  req: Request,
  properties: FormFieldProperties
): Promise<FormParsed<T>> {
  return new Promise((resolve, reject) => {
    let form = formidable({
      allowEmptyFiles: true,
      minFileSize: 0,
    });

    form
      .parse(req)
      .then((data) => {
        resolve(processFormData<T>(data, properties));
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}
