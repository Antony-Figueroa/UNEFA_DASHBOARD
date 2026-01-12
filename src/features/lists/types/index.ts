export interface ListValue {
  id: string;
  name: string;
  abbreviation: string;
  listId: string;
  status: boolean;
}

export interface List {
  id: string;
  name: string;
  status: boolean;
  values: ListValue[];
}

export type ListsDictionary = Record<string, ListValue[]>;
