package com.finance.salary.config;

import com.finance.salary.entity.AuditLog;
import com.finance.salary.entity.ChatHistory;
import com.finance.salary.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Set;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;

    private static final Set<String> EXCLUDED_ENTITIES = Set.of(
            AuditLog.class.getSimpleName(),
            ChatHistory.class.getSimpleName()
    );

    @Pointcut("execution(* org.springframework.data.repository.CrudRepository+.save(..))")
    public void saveOperations() {}

    @Pointcut("execution(* org.springframework.data.repository.CrudRepository+.delete(..))")
    public void deleteOperations() {}

    @Pointcut("execution(* org.springframework.data.repository.CrudRepository+.deleteById(..))")
    public void deleteByIdOperations() {}

    @Around("saveOperations()")
    public Object auditSave(ProceedingJoinPoint joinPoint) throws Throwable {
        Object[] args = joinPoint.getArgs();
        if (args.length == 0) {
            return joinPoint.proceed();
        }

        Object entity = args[0];
        if (entity instanceof Iterable) {
            return joinPoint.proceed();
        }

        String entityType = entity.getClass().getSimpleName();
        if (EXCLUDED_ENTITIES.contains(entityType)) {
            return joinPoint.proceed();
        }

        Serializable id = getId(entity);

        if (id == null) {
            Object result = joinPoint.proceed();
            Serializable resultId = getId(result);
            String newJson = auditService.toJson(result);
            auditService.logCreate(entityType, resultId instanceof Long ? (Long) resultId : null, newJson);
            return result;
        }

        // For updates: serialize old values BEFORE save within REQUIRES_NEW
        String oldJson = auditService.findOldValuesAsJson(entity.getClass(), id);

        Object result = joinPoint.proceed();

        if (oldJson != null) {
            String newJson = auditService.toJson(result);
            Serializable resultId = getId(result);
            auditService.logUpdate(entityType, resultId instanceof Long ? (Long) resultId : null, oldJson, newJson);
        } else {
            String newJson = auditService.toJson(result);
            auditService.logCreate(entityType, id instanceof Long ? (Long) id : null, newJson);
        }

        return result;
    }

    @Around("deleteOperations() || deleteByIdOperations()")
    public Object auditDelete(ProceedingJoinPoint joinPoint) throws Throwable {
        Object[] args = joinPoint.getArgs();
        if (args.length == 0) {
            return joinPoint.proceed();
        }

        String methodName = joinPoint.getSignature().getName();
        Class<?> entityClass = getEntityTypeFromRepository(joinPoint);

        if (entityClass != null) {
            String entityType = entityClass.getSimpleName();
            if (EXCLUDED_ENTITIES.contains(entityType)) {
                return joinPoint.proceed();
            }

            if (methodName.equals("delete")) {
                Object entity = args[0];
                Serializable id = getId(entity);
                if (id != null) {
                    String oldJson = auditService.findOldValuesAsJson(entityClass, id);
                    Object result = joinPoint.proceed();
                    auditService.logDelete(entityType, id instanceof Long ? (Long) id : null, oldJson);
                    return result;
                }
            } else if (methodName.equals("deleteById")) {
                Serializable id = (Serializable) args[0];
                String oldJson = id != null ? auditService.findOldValuesAsJson(entityClass, id) : null;
                Object result = joinPoint.proceed();
                if (oldJson != null) {
                    auditService.logDelete(entityType, id instanceof Long ? (Long) id : null, oldJson);
                }
                return result;
            }
        }

        return joinPoint.proceed();
    }

    private Serializable getId(Object entity) {
        try {
            java.lang.reflect.Field idField = entity.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            return (Serializable) idField.get(entity);
        } catch (Exception e) {
            return null;
        }
    }

    private Class<?> getEntityTypeFromRepository(ProceedingJoinPoint joinPoint) {
        Object target = joinPoint.getTarget();
        Class<?> targetClass = target.getClass();
        for (Class<?> intf : targetClass.getInterfaces()) {
            if (org.springframework.data.repository.Repository.class.isAssignableFrom(intf)) {
                java.lang.reflect.Type[] genTypes = intf.getGenericInterfaces();
                for (java.lang.reflect.Type genType : genTypes) {
                    if (genType instanceof java.lang.reflect.ParameterizedType pt) {
                        java.lang.reflect.Type[] typeArgs = pt.getActualTypeArguments();
                        if (typeArgs.length >= 1 && typeArgs[0] instanceof Class) {
                            return (Class<?>) typeArgs[0];
                        }
                    }
                }
            }
        }
        return null;
    }
}
