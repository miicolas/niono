export type MediaKind = "image" | "file" | "bookmark";
export type MediaValues = {
  url: string;
  name: string;
  caption: string;
  alt: string;
  description: string;
  width: string;
  alignment: string;
};
export type MediaFormProps = {
  kind: MediaKind;
  values: MediaValues;
  onSubmit: (values: MediaValues) => void;
  onUpload: (file: File) => void;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
};
export type UploadResult = {
  url: string;
  name: string;
  mime: string;
  size?: number;
};
export type UploadHandler = (
  file: File,
  signal?: AbortSignal,
) => Promise<UploadResult>;
