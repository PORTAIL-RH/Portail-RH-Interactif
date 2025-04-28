package com.example.PortailRH.Model;

import java.util.Date;

public class FileMetadataResponse {
    private String fileId;
    private String filename;
    private long size;
    private String contentType;
    private Date uploadDate;

    public FileMetadataResponse(String fileId, String filename, long size, String contentType, Date uploadDate) {
        this.fileId = fileId;
        this.filename = filename;
        this.size = size;
        this.contentType = contentType;
        this.uploadDate = uploadDate;
    }

    // Getters
    public String getFileId() { return fileId; }
    public String getFilename() { return filename; }
    public long getSize() { return size; }
    public String getContentType() { return contentType; }
    public Date getUploadDate() { return uploadDate; }
}