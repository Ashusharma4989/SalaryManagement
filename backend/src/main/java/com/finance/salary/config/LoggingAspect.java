package com.finance.salary.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Pointcut("execution(* com.finance.salary.controller.*.*(..))")
    public void controllerMethods() {}

    @Pointcut("execution(* com.finance.salary.service.*.*(..))")
    public void serviceMethods() {}

    @Around("controllerMethods()")
    public Object logControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = getHttpRequest();
        String method = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        if (request != null) {
            log.info(">>> [{}] {}.{} | URI: {} {} | Args: {}",
                    request.getMethod(),
                    className,
                    method,
                    request.getRequestURI(),
                    request.getQueryString() != null ? "?" + request.getQueryString() : "",
                    Arrays.toString(joinPoint.getArgs())
            );
        } else {
            log.info(">>> {}.{} | Args: {}",
                    className,
                    method,
                    Arrays.toString(joinPoint.getArgs())
            );
        }

        long startTime = System.currentTimeMillis();
        Object result;
        try {
            result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.info("<<< [{}ms] {}.{} | Status: Success",
                    duration,
                    className,
                    method
            );
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("<<< [{}ms] {}.{} | Status: Exception - {}",
                    duration,
                    className,
                    method,
                    ex.getMessage()
            );
            throw ex;
        }
    }

    @Around("serviceMethods()")
    public Object logServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        
        log.debug("Service >>> {}.{}", className, method);

        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.debug("Service <<< [{}ms] {}.{} | Success", duration, className, method);
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.debug("Service <<< [{}ms] {}.{} | Exception: {}", duration, className, method, ex.getMessage());
            throw ex;
        }
    }

    private HttpServletRequest getHttpRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                return attributes.getRequest();
            }
        } catch (Exception e) {
            // Not in request context
        }
        return null;
    }
}
