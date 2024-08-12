interface PdfStorage {
    container: string,
    blobName: string,
    token: string,
    uri: string,
    documentNumber?: string
}

export default PdfStorage;