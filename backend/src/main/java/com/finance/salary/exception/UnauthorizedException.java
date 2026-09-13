package com.finance.salary.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for authentication/authorization failures
 */
public class UnauthorizedException extends AppException {

    public UnauthorizedException(String message) {
        super(
                message,
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED"
        );
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(
                message,
                HttpStatus.UNAUTHORIZED.value(),
                "UNAUTHORIZED",
                cause
        );
    }
}
