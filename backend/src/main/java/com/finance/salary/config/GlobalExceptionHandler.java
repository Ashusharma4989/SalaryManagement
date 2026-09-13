package com.finance.salary.config;

import com.finance.salary.dto.response.ApiResponse;
import com.finance.salary.dto.response.FieldError;
import com.finance.salary.exception.AppException;
import com.finance.salary.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.ArrayList;
import java.util.List;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex, WebRequest request) {
        log.warn("AppException occurred: {} - {}", ex.getErrorCode(), ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
                ex.getMessage(),
                ex.getErrorCode()
        );
        
        return ResponseEntity
                .status(ex.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
                ex.getMessage(),
                "RESOURCE_NOT_FOUND"
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        
        BindingResult bindingResult = ex.getBindingResult();
        List<FieldError> errors = new ArrayList<>();
        
        bindingResult.getFieldErrors().forEach(error ->
                errors.add(FieldError.of(
                        error.getField(),
                        error.getDefaultMessage(),
                        error.getRejectedValue()
                ))
        );
        
        bindingResult.getGlobalErrors().forEach(error ->
                errors.add(FieldError.of(
                        error.getObjectName(),
                        error.getDefaultMessage(),
                        null
                ))
        );
        
        log.warn("Validation error occurred: {} errors", errors.size());
        
        ApiResponse<Object> response = ApiResponse.error(
                "Validation failed",
                "VALIDATION_ERROR",
                errors
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(
            Exception ex,
            WebRequest request) {
        
        log.error("Unhandled exception occurred", ex);
        
        ApiResponse<Object> response = ApiResponse.error(
                "An unexpected error occurred. Please try again later.",
                "INTERNAL_SERVER_ERROR"
        );
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}
