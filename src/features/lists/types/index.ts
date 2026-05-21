export interface ListValue {
  id: string;
  name: string;
  abbreviation: string;
  listId: string;
  status: boolean;
  inUse?: boolean;
}

export interface List {
  id: string;
  name: string;
  status: boolean;
  hasInUseValues?: boolean;
  values: ListValue[];
}

export type ListsDictionary = Record<string, ListValue[]>;
