export interface ListDB {
  LIST_ID: number;
  NAME: string;
  STATUS: number;
  t_value_list?: ValueListDB[];
  [key: string]: unknown;
}

export interface ValueListDB {
  VALUE_LIST_ID: number;
  NAME: string;
  ABBREVIATION: string;
  LIST_ID: number;
  STATUS: number;
  [key: string]: unknown;
}

export interface AppList {
  id: string;
  name: string;
  status: boolean;
  values: {
    id: string;
    name: string;
    abbreviation: string;
    listId: string;
    status: boolean;
  }[];
}
