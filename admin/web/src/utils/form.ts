import { createSignal, Accessor, Setter } from "solid-js";

export type ValidationFn<T> = (value: T) => string | undefined;

export interface FieldDef<T, IsArray extends boolean = false> {
  default: T;
  validate?: ValidationFn<T>;
  isArray: IsArray;
  subSchema?: any;
}

export interface Field<T> {
  name: string;
  get: Accessor<T>;
  set: (v: T) => void;
  error: Accessor<string | undefined>;
  setError: Setter<string | undefined>;
  validate: () => string | undefined;
}

export interface FormArrayField<S extends Record<string, FieldDef<any, any>>> {
  name: string;
  forms: Accessor<ReturnType<typeof createForm<S>>[]>;
  add: (initial?: Partial<InferSchema<S>>) => void;
  remove: (index: number) => void;
  error: Accessor<string | undefined>;
  setError: Setter<string | undefined>;
  validate: () => boolean;
}

export type InferSchema<S> = {
  [K in keyof S]: S[K] extends FieldDef<infer T, any> ? T : never;
};

export const validateArrReduce = <T>(fns: ValidationFn<T>[]) => {
  return (val: T) => fns.reduce((err, fn) => err || fn(val), undefined as string | undefined)
}

export const fields = {
  string: (v: ValidationFn<string>[], def = ""): FieldDef<string, false> =>
    ({ default: def, validate: validateArrReduce(v), isArray: false }),

  number: (v: ValidationFn<number>[], def = 0): FieldDef<number, false> =>
    ({ default: def, validate: validateArrReduce(v), isArray: false }),

  stringArray: (v: ValidationFn<string[]>[], def = []): FieldDef<string[], false> =>
    ({ default: def, validate: validateArrReduce(v), isArray: false }),

  formArray: <S extends Record<string, FieldDef<string, any>>>(
    subSchema: S,
    validators: ValidationFn<InferSchema<S>[]>[] = [],
    def: InferSchema<S>[] = []
  ): FieldDef<InferSchema<S>[], true> => ({
    default: def,
    isArray: true,
    subSchema,
    validate: validateArrReduce(validators),
  }),
};

export function createForm<S extends Record<string, FieldDef<any, any>>>(
  schema: S,
  initialValues?: Partial<InferSchema<S>>
) {
  type Values = InferSchema<S>;

  const fieldsObj = {} as {
    [K in keyof S]: S[K] extends FieldDef<any, true>
    ? FormArrayField<S[K]["subSchema"]>
    : Field<Values[K]>
  };

  for (const key in schema) {
    const def = schema[key];
    const initial = (initialValues?.[key] ?? def.default) as any;

    if (def.isArray) {
      const [forms, setForms] = createSignal<any[]>(
        initial.map((v: any) => createForm(def.subSchema, v))
      );
      const [error, setError] = createSignal<string>();

      (fieldsObj as any)[key] = {
        name: key,
        forms,
        error,
        setError,
        add: (v = {}) => setForms(prev => [...prev, createForm(def.subSchema, v)]),
        remove: (i: number) => setForms(prev => prev.filter((_, idx) => idx !== i)),
        validate: () => {
          const currentValues = forms().map(f => f.values());
          const schemaErr = def.validate?.(currentValues);
          const childrenValid = forms().every(f => f.validate());
          const err = schemaErr || (!childrenValid ? "Invalid items" : undefined);
          setError(err);
          return !err;
        }
      };
    } else {
      const [value, setValue] = createSignal(initial);
      const [error, setError] = createSignal<string>();

      (fieldsObj as any)[key] = {
        name: key,
        get: value,
        set: setValue,
        error,
        setError,
        validate: () => {
          const err = def.validate?.(value());
          setError(err);
          return err;
        }
      };
    }
  }

  const validate = () => {
    let isValid = true;
    for (const key in fieldsObj) {
      const field = fieldsObj[key];
      const result = field.validate();
      if (typeof result === "string" || result === false) isValid = false;
    }
    return isValid;
  };

  const values = (): Values => {
    const out = {} as any;
    for (const key in schema) {
      if (schema[key].isArray) {
        out[key] = (fieldsObj[key] as any).forms().map((f: any) => f.values());
      } else {
        out[key] = (fieldsObj[key] as any).get();
      }
    }
    return out;
  };

  return { fields: fieldsObj, validate, values };
}
