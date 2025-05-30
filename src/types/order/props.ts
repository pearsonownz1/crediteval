export interface StepProps<T> {
  data: T;
  updateData: (data: Partial<T>) => void;
  error?: string | null;
}

export interface DocumentStepProps {
  documents: DocumentState[];
  updateDocuments: (
    updater: DocumentState[] | ((prevDocs: DocumentState[]) => DocumentState[])
  ) => void;
  orderId: string | null;
}
