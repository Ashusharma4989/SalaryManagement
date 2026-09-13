package com.finance.salary.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when trying to create a duplicate resource
 */
public class DuplicateResourceException extends AppException {

    public DuplicateResourceException(String resourceName, String fieldName, String value) {
        super(
                String.format("%s with %s '%s' already exists", resourceName, fieldName, value),
                HttpStatus.CONFLICT.value(),
                "DUPLICATE_RESOURCE"
        );
    }

    public DuplicateResourceException(String message) {
        super(
                message,
                HttpStatus.CONFLICT.value(),
                "DUPLICATE_RESOURCE"
        );
    }
}
