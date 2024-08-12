import { CatchCertificateModel } from "../persistence/schema/catchCert";
import { CatchCertificateDraft } from "../persistence/schema/frontEndModels/catchCertificate";
import { StorageDocumentDraft } from "../persistence/schema/frontEndModels/storageDocument";
import { ProcessingStatementDraft, IProcessingStatementModel } from "../persistence/schema/processingStatement";
import { StorageDocumentModel } from "../persistence/schema/storageDoc";

export type DocumentsInProgress = CatchCertificateDraft[] | ProcessingStatementDraft[] | StorageDocumentDraft[];
export type DocumentsCompleted = CatchCertificateModel[] | IProcessingStatementModel[] | StorageDocumentModel[];

export interface AllDocuments {
  inProgress: DocumentsInProgress;
  completed: DocumentsCompleted;
}
