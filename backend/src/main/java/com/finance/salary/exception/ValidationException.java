package com.finance.salary.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for validation errors
 */
public class ValidationException extends AppException {

    public ValidationException(String message) {
        super(
                message,
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR"
        );
    }

    public ValidationException(String message, Throwable cause) {
        super(
                message,
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                cause
        );
    }
}
