package com.finance.salary.exception;

/**
 * Base application exception for runtime errors
 */
public class AppException extends RuntimeException {

    private final int httpStatus;
    private final String errorCode;

    public AppException(String message, int httpStatus, String errorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorCode = errorCode;
    }

    public AppException(String message, int httpStatus, String errorCode, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
        this.errorCode = errorCode;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
