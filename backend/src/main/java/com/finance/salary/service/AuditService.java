package com.finance.salary.service;

import com.finance.salary.entity.AuditLog;
import com.finance.salary.repository.AuditLogRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.node.ObjectNode;

import java.io.Serializable;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    private ObjectMapper auditMapper;

    @PostConstruct
    public void init() {
        this.auditMapper = objectMapper.rebuild()
                .configure(SerializationFeature.WRITE_SELF_REFERENCES_AS_NULL, true)
                .build();
    }

    public void logCreate(String entityType, Long entityId, String newValuesJson) {
        saveAuditLogJson(entityType, entityId, "CREATE", null, newValuesJson);
    }

    public void logUpdate(String entityType, Long entityId, String oldValuesJson, String newValuesJson) {
        saveAuditLogJson(entityType, entityId, "UPDATE", oldValuesJson, newValuesJson);
    }

    public void logDelete(String entityType, Long entityId, String oldValuesJson) {
        saveAuditLogJson(entityType, entityId, "DELETE", oldValuesJson, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogin(String username) {
        String currentUser = getCurrentUsername();
        AuditLog auditLog = new AuditLog();
        auditLog.setEntityType("AUTH");
        auditLog.setEntityId(null);
        auditLog.setAction("LOGIN");
        auditLog.setUsername(username != null ? username : currentUser);
        auditLog.setDetails("User logged in successfully");
        auditLogRepository.save(auditLog);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveAuditLogJson(String entityType, Long entityId, String action, String oldValuesJson, String newValuesJson) {
        String username = getCurrentUsername();

        AuditLog auditLog = new AuditLog();
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setAction(action);
        auditLog.setUsername(username);
        auditLog.setOldValues(oldValuesJson);
        auditLog.setNewValues(newValuesJson);

        auditLogRepository.save(auditLog);
    }

    public String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return auditMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return toJsonSimple(obj);
        }
    }

    private String toJsonSimple(Object obj) {
        try {
            ObjectNode node = auditMapper.getNodeFactory().objectNode();
            for (Field field : obj.getClass().getDeclaredFields()) {
                if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) {
                    continue;
                }
                field.setAccessible(true);
                Object value = field.get(obj);
                if (value == null) {
                    continue;
                }
                String fieldName = field.getName();
                if (value instanceof String str) {
                    node.put(fieldName, str);
                } else if (value instanceof Number num) {
                    node.put(fieldName, num.toString());
                } else if (value instanceof Boolean bool) {
                    node.put(fieldName, bool);
                } else if (value instanceof Enum<?> enumVal) {
                    node.put(fieldName, enumVal.name());
                } else if (value instanceof LocalDateTime ldt) {
                    node.put(fieldName, ldt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                } else if (value instanceof Collection<?> coll) {
                    node.put(fieldName + "_count", coll.size());
                } else {
                    Serializable refId = getId(value);
                    if (refId != null) {
                        node.put(fieldName + "_id", refId.toString());
                    } else {
                        node.put(fieldName, value.getClass().getSimpleName());
                    }
                }
            }
            return auditMapper.writeValueAsString(node);
        } catch (Exception e) {
            log.warn("Failed to serialize object to JSON: {}", e.getMessage());
            return null;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public String findOldValuesAsJson(Class<?> entityClass, Serializable id) {
        if (id == null) {
            return null;
        }
        try {
            Object oldEntity = entityManager.find(entityClass, id);
            return oldEntity != null ? toJson(oldEntity) : null;
        } catch (Exception e) {
            log.warn("Failed to fetch/serialize old values for {} id={}: {}", entityClass.getSimpleName(), id, e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public <T> T findOldValues(Class<T> entityClass, Serializable id) {
        if (id == null) {
            return null;
        }
        return entityManager.find(entityClass, id);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(String entityType, String username, String action, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        if (entityType != null && !entityType.isBlank()) {
            return auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageRequest).getContent();
        } else if (username != null && !username.isBlank()) {
            return auditLogRepository.findByUsernameOrderByCreatedAtDesc(username, pageRequest).getContent();
        } else if (action != null && !action.isBlank()) {
            return auditLogRepository.findByActionOrderByCreatedAtDesc(action, pageRequest).getContent();
        } else {
            return auditLogRepository.findAll(pageRequest).getContent();
        }
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }

    private Serializable getId(Object entity) {
        try {
            Field idField = entity.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            return (Serializable) idField.get(entity);
        } catch (Exception e) {
            return null;
        }
    }
}
